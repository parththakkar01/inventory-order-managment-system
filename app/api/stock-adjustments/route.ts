import { NextResponse } from "next/server";
import { StockMovementType } from "@prisma/client";

import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { decimal } from "@/lib/stock";
import { stockAdjustmentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error) return error;

  const parsed = stockAdjustmentSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid adjustment.");

  const data = parsed.data;
  const quantityKg = decimal(data.quantityKg);

  const adjustment = await prisma.$transaction(async (tx) => {
    const batch = await tx.importBatch.findUnique({ where: { id: data.importBatchId } });

    if (!batch) {
      throw new Error("Import batch not found.");
    }

    const nextRemaining = batch.remainingKg.plus(quantityKg);

    if (nextRemaining.isNegative()) {
      throw new Error("Adjustment would make stock negative.");
    }

    await tx.importBatch.update({
      where: { id: batch.id },
      data: { remainingKg: nextRemaining }
    });

    const created = await tx.stockAdjustment.create({
      data: {
        importBatchId: batch.id,
        createdById: user.id,
        type: data.type,
        quantityKg,
        reason: data.reason
      }
    });

    await tx.stockMovement.create({
      data: {
        importBatchId: batch.id,
        stockAdjustmentId: created.id,
        type: StockMovementType.ADJUSTMENT,
        quantityKg,
        note: data.reason
      }
    });

    return created;
  }).catch((transactionError) => {
    if (transactionError instanceof Error) {
      return transactionError;
    }

    return new Error("Could not adjust stock.");
  });

  if (adjustment instanceof Error) {
    return jsonError(adjustment.message);
  }

  return NextResponse.json({ adjustment }, { status: 201 });
}
