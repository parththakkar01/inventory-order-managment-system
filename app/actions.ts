"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { StockMovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decimal } from "@/lib/stock";

async function requireSignedIn() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

export async function createMaterial(formData: FormData) {
  await requireSignedIn();

  await prisma.material.create({
    data: {
      type: text(formData, "type"),
      grade: text(formData, "grade"),
      description: optionalText(formData, "description"),
      minimumStockKg: decimal(numberValue(formData, "minimumStockKg"))
    }
  });

  revalidatePath("/inventory");
}

export async function deleteMaterial(formData: FormData) {
  await requireSignedIn();

  await prisma.material.delete({
    where: { id: text(formData, "id") }
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function createSupplier(formData: FormData) {
  await requireSignedIn();

  await prisma.supplier.create({
    data: {
      name: text(formData, "name"),
      country: text(formData, "country"),
      email: optionalText(formData, "email"),
      phone: optionalText(formData, "phone"),
      address: optionalText(formData, "address")
    }
  });

  revalidatePath("/inventory");
}

export async function createImportBatch(formData: FormData) {
  const user = await requireSignedIn();
  const quantityKg = numberValue(formData, "quantityKg");
  const purchaseUnitPrice = numberValue(formData, "purchaseUnitPrice");

  await prisma.$transaction(async (tx) => {
    const batch = await tx.importBatch.create({
      data: {
        batchCode: text(formData, "batchCode"),
        materialId: text(formData, "materialId"),
        supplierId: text(formData, "supplierId"),
        createdById: user.id,
        quantityKg: decimal(quantityKg),
        remainingKg: decimal(quantityKg),
        countryOfOrigin: text(formData, "countryOfOrigin"),
        purchaseUnitPrice: decimal(purchaseUnitPrice),
        purchaseTotal: decimal(quantityKg * purchaseUnitPrice),
        currency: text(formData, "currency") as "INR" | "USD" | "EUR" | "GBP" | "AED" | "SGD" | "CNY" | "JPY",
        importDate: new Date(text(formData, "importDate")),
        notes: optionalText(formData, "notes")
      }
    });

    await tx.stockMovement.create({
      data: {
        importBatchId: batch.id,
        type: StockMovementType.IMPORT,
        quantityKg: decimal(quantityKg),
        note: "Import batch created"
      }
    });
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function adjustStock(formData: FormData) {
  const user = await requireSignedIn();
  const quantityKg = numberValue(formData, "quantityKg");

  await prisma.$transaction(async (tx) => {
    const batch = await tx.importBatch.findUniqueOrThrow({
      where: { id: text(formData, "importBatchId") }
    });
    const nextRemaining = batch.remainingKg.plus(decimal(quantityKg));

    if (nextRemaining.isNegative()) {
      throw new Error("Stock cannot go below zero.");
    }

    await tx.importBatch.update({
      where: { id: batch.id },
      data: { remainingKg: nextRemaining }
    });

    const adjustment = await tx.stockAdjustment.create({
      data: {
        importBatchId: batch.id,
        createdById: user.id,
        type: text(formData, "type") as "DAMAGE" | "RETURN" | "CORRECTION" | "OTHER",
        quantityKg: decimal(quantityKg),
        reason: text(formData, "reason")
      }
    });

    await tx.stockMovement.create({
      data: {
        importBatchId: batch.id,
        stockAdjustmentId: adjustment.id,
        type: StockMovementType.ADJUSTMENT,
        quantityKg: decimal(quantityKg),
        note: text(formData, "reason")
      }
    });
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function createBuyer(formData: FormData) {
  await requireSignedIn();

  await prisma.buyer.create({
    data: {
      name: text(formData, "name"),
      gstin: optionalText(formData, "gstin"),
      email: optionalText(formData, "email"),
      phone: optionalText(formData, "phone"),
      address: optionalText(formData, "address")
    }
  });

  revalidatePath("/sales");
}

export async function createSale(formData: FormData) {
  const user = await requireSignedIn();
  const quantityKg = numberValue(formData, "quantityKg");
  const saleUnitPrice = numberValue(formData, "saleUnitPrice");
  const gstRate = numberValue(formData, "gstRate", 18);

  await prisma.$transaction(async (tx) => {
    const batch = await tx.importBatch.findUniqueOrThrow({
      where: { id: text(formData, "importBatchId") }
    });

    if (batch.remainingKg.lessThan(decimal(quantityKg))) {
      throw new Error("Not enough stock in this batch.");
    }

    const subtotal = quantityKg * saleUnitPrice;
    const gstAmount = subtotal * (gstRate / 100);

    const sale = await tx.sale.create({
      data: {
        buyerId: text(formData, "buyerId"),
        materialId: batch.materialId,
        createdById: user.id,
        saleDate: new Date(text(formData, "saleDate")),
        paymentStatus: text(formData, "paymentStatus") as "PAID" | "PENDING" | "PARTIAL",
        currency: "INR",
        subtotal: decimal(subtotal),
        gstRate: decimal(gstRate),
        gstAmount: decimal(gstAmount),
        totalAmount: decimal(subtotal + gstAmount),
        notes: optionalText(formData, "notes"),
        lines: {
          create: {
            importBatchId: batch.id,
            quantityKg: decimal(quantityKg),
            saleUnitPrice: decimal(saleUnitPrice),
            lineTotal: decimal(subtotal)
          }
        }
      }
    });

    await tx.importBatch.update({
      where: { id: batch.id },
      data: { remainingKg: { decrement: decimal(quantityKg) } }
    });

    await tx.stockMovement.create({
      data: {
        importBatchId: batch.id,
        saleId: sale.id,
        type: StockMovementType.SALE,
        quantityKg: decimal(quantityKg).negated(),
        note: `Sale ${sale.saleNumber}`
      }
    });

    await tx.invoice.create({
      data: {
        saleId: sale.id,
        companyName: "Your Company Name",
        companyGstin: "YOUR-GSTIN"
      }
    });
  });

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function createUser(formData: FormData) {
  const user = await requireSignedIn();

  if (user.role !== "ADMIN") {
    throw new Error("Admin access is required.");
  }

  await prisma.user.create({
    data: {
      name: optionalText(formData, "name"),
      email: text(formData, "email").toLowerCase(),
      role: text(formData, "role") as "ADMIN" | "STAFF",
      passwordHash: await bcrypt.hash(text(formData, "password"), 12)
    }
  });

  revalidatePath("/dashboard");
}
