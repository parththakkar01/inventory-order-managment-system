import { NextResponse } from "next/server";
import { StockMovementType } from "@prisma/client";

import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { decimal } from "@/lib/stock";
import { saleSchema } from "@/lib/validators";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const sales = await prisma.sale.findMany({
    include: {
      buyer: true,
      material: true,
      invoice: true,
      lines: { include: { importBatch: true } }
    },
    orderBy: { saleDate: "desc" }
  });

  return NextResponse.json({ sales });
}

export async function POST(request: Request) {
  const { error, user } = await requireUser();
  if (error) return error;

  const parsed = saleSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid sale.");

  const data = parsed.data;

  const sale = await prisma.$transaction(async (tx) => {
    const batches = await tx.importBatch.findMany({
      where: { id: { in: data.lines.map((line) => line.importBatchId) } }
    });

    if (batches.length !== data.lines.length) {
      throw new Error("One or more import batches were not found.");
    }

    for (const line of data.lines) {
      const batch = batches.find((item) => item.id === line.importBatchId);

      if (!batch || batch.materialId !== data.materialId) {
        throw new Error("Sale lines must match the selected material.");
      }

      if (batch.remainingKg.lessThan(decimal(line.quantityKg))) {
        throw new Error(`Batch ${batch.batchCode} does not have enough stock.`);
      }
    }

    const subtotalNumber = data.lines.reduce((sum, line) => sum + line.quantityKg * line.saleUnitPrice, 0);
    const gstAmountNumber = subtotalNumber * (data.gstRate / 100);
    const subtotal = decimal(subtotalNumber);
    const gstAmount = decimal(gstAmountNumber);
    const totalAmount = decimal(subtotalNumber + gstAmountNumber);

    const createdSale = await tx.sale.create({
      data: {
        buyerId: data.buyerId,
        materialId: data.materialId,
        createdById: user.id,
        saleDate: data.saleDate,
        paymentStatus: data.paymentStatus,
        currency: data.currency,
        subtotal,
        gstRate: decimal(data.gstRate),
        gstAmount,
        totalAmount,
        notes: data.notes,
        lines: {
          create: data.lines.map((line) => ({
            importBatchId: line.importBatchId,
            quantityKg: decimal(line.quantityKg),
            saleUnitPrice: decimal(line.saleUnitPrice),
            lineTotal: decimal(line.quantityKg * line.saleUnitPrice)
          }))
        }
      },
      include: { lines: true }
    });

    for (const line of data.lines) {
      const quantityKg = decimal(line.quantityKg);

      await tx.importBatch.update({
        where: { id: line.importBatchId },
        data: { remainingKg: { decrement: quantityKg } }
      });

      await tx.stockMovement.create({
        data: {
          importBatchId: line.importBatchId,
          saleId: createdSale.id,
          type: StockMovementType.SALE,
          quantityKg: quantityKg.negated(),
          note: `Sale ${createdSale.saleNumber}`
        }
      });
    }

    await tx.invoice.create({
      data: {
        saleId: createdSale.id,
        companyName: "Your Company Name",
        companyGstin: "YOUR-GSTIN"
      }
    });

    return tx.sale.findUniqueOrThrow({
      where: { id: createdSale.id },
      include: {
        buyer: true,
        material: true,
        invoice: true,
        lines: { include: { importBatch: true } }
      }
    });
  }).catch((transactionError) => {
    if (transactionError instanceof Error) {
      return transactionError;
    }

    return new Error("Could not record sale.");
  });

  if (sale instanceof Error) {
    return jsonError(sale.message);
  }

  return NextResponse.json({ sale }, { status: 201 });
}
