import { NextResponse } from "next/server";
import { StockMovementType } from "@prisma/client";

import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { decimal } from "@/lib/stock";
import { importBatchSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const imports = await prisma.importBatch.findMany({
    where: q
      ? {
          OR: [
            { batchCode: { contains: q, mode: "insensitive" } },
            { countryOfOrigin: { contains: q, mode: "insensitive" } },
            { material: { type: { contains: q, mode: "insensitive" } } },
            { material: { grade: { contains: q, mode: "insensitive" } } },
            { supplier: { name: { contains: q, mode: "insensitive" } } }
          ]
        }
      : undefined,
    include: { material: true, supplier: true },
    orderBy: { importDate: "desc" }
  });

  return NextResponse.json({ imports });
}

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error) return error;

  const parsed = importBatchSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid import.");

  const data = parsed.data;
  const quantityKg = decimal(data.quantityKg);
  const purchaseUnitPrice = decimal(data.purchaseUnitPrice);
  const purchaseTotal = decimal(data.purchaseTotal ?? data.quantityKg * data.purchaseUnitPrice);

  const importBatch = await prisma.$transaction(async (tx) => {
    const batch = await tx.importBatch.create({
      data: {
        batchCode: data.batchCode,
        materialId: data.materialId,
        supplierId: data.supplierId,
        createdById: user.id,
        quantityKg,
        remainingKg: quantityKg,
        countryOfOrigin: data.countryOfOrigin,
        purchaseUnitPrice,
        purchaseTotal,
        currency: data.currency,
        importDate: data.importDate,
        notes: data.notes
      },
      include: { material: true, supplier: true }
    });

    await tx.stockMovement.create({
      data: {
        importBatchId: batch.id,
        type: StockMovementType.IMPORT,
        quantityKg,
        note: "Import batch created"
      }
    });

    return batch;
  });

  return NextResponse.json({ importBatch }, { status: 201 });
}
