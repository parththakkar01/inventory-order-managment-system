"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, StockMovementType } from "@prisma/client";
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

function requiredText(formData: FormData, key: string, label: string) {
  const value = text(formData, key);

  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

function validNumber(formData: FormData, key: string, label: string, minimum = 0) {
  const value = Number(formData.get(key));

  if (!Number.isFinite(value) || value < minimum) {
    throw new Error(`${label} must be at least ${minimum}.`);
  }

  return value;
}

async function requireAdmin() {
  const user = await requireSignedIn();

  if (user.role !== "ADMIN") {
    throw new Error("Admin access is required.");
  }

  return user;
}

function revalidateOperations() {
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/sales");
  revalidatePath("/invoices");
  revalidatePath("/reports");
}

async function deleteBatchesAndAffectedSales(
  tx: Prisma.TransactionClient,
  batchIds: string[],
  additionalSaleIds: string[] = []
) {
  const batchIdSet = new Set(batchIds);
  const affectedLines = batchIds.length
    ? await tx.saleLine.findMany({ where: { importBatchId: { in: batchIds } }, select: { saleId: true } })
    : [];
  const saleIds = [...new Set([...additionalSaleIds, ...affectedLines.map((line) => line.saleId)])];

  if (saleIds.length > 0) {
    const saleLines = await tx.saleLine.findMany({
      where: { saleId: { in: saleIds } },
      select: { importBatchId: true, quantityKg: true }
    });

    for (const line of saleLines) {
      if (!batchIdSet.has(line.importBatchId)) {
        await tx.importBatch.update({
          where: { id: line.importBatchId },
          data: { remainingKg: { increment: line.quantityKg } }
        });
      }
    }

    await tx.stockMovement.deleteMany({ where: { saleId: { in: saleIds } } });
  }

  if (batchIds.length > 0) {
    await tx.stockMovement.deleteMany({ where: { importBatchId: { in: batchIds } } });
  }

  if (saleIds.length > 0) {
    await tx.sale.deleteMany({ where: { id: { in: saleIds } } });
  }

  if (batchIds.length > 0) {
    await tx.stockAdjustment.deleteMany({ where: { importBatchId: { in: batchIds } } });
    await tx.importBatch.deleteMany({ where: { id: { in: batchIds } } });
  }
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

  const id = requiredText(formData, "id", "Material");
  await prisma.$transaction(async (tx) => {
    const material = await tx.material.findUnique({
      where: { id },
      include: { imports: { select: { id: true } }, sales: { select: { id: true } } }
    });

    if (!material) throw new Error("Material not found.");

    await deleteBatchesAndAffectedSales(
      tx,
      material.imports.map((batch) => batch.id),
      material.sales.map((sale) => sale.id)
    );
    await tx.material.delete({ where: { id } });
  });

  revalidateOperations();
}

export async function updateMaterial(formData: FormData) {
  await requireSignedIn();

  await prisma.material.update({
    where: { id: requiredText(formData, "id", "Material") },
    data: {
      type: requiredText(formData, "type", "Material type"),
      grade: requiredText(formData, "grade", "Grade"),
      description: optionalText(formData, "description"),
      minimumStockKg: decimal(validNumber(formData, "minimumStockKg", "Minimum stock"))
    }
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

export async function updateSupplier(formData: FormData) {
  await requireSignedIn();

  await prisma.supplier.update({
    where: { id: requiredText(formData, "id", "Supplier") },
    data: {
      name: requiredText(formData, "name", "Supplier name"),
      country: requiredText(formData, "country", "Country"),
      email: optionalText(formData, "email"),
      phone: optionalText(formData, "phone"),
      address: optionalText(formData, "address")
    }
  });

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

export async function deleteSupplier(formData: FormData) {
  await requireSignedIn();

  const id = requiredText(formData, "id", "Supplier");
  await prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findUnique({ where: { id }, include: { imports: { select: { id: true } } } });

    if (!supplier) throw new Error("Supplier not found.");

    await deleteBatchesAndAffectedSales(tx, supplier.imports.map((batch) => batch.id));
    await tx.supplier.delete({ where: { id } });
  });

  revalidateOperations();
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

export async function updateImportBatch(formData: FormData) {
  await requireSignedIn();

  const id = requiredText(formData, "id", "Import batch");
  const purchaseUnitPrice = validNumber(formData, "purchaseUnitPrice", "Purchase price");
  const batch = await prisma.importBatch.findUniqueOrThrow({ where: { id } });

  await prisma.importBatch.update({
    where: { id },
    data: {
      batchCode: requiredText(formData, "batchCode", "Batch code"),
      supplierId: requiredText(formData, "supplierId", "Supplier"),
      countryOfOrigin: requiredText(formData, "countryOfOrigin", "Country of origin"),
      purchaseUnitPrice: decimal(purchaseUnitPrice),
      purchaseTotal: batch.quantityKg.mul(decimal(purchaseUnitPrice)),
      currency: requiredText(formData, "currency", "Currency") as "INR" | "USD" | "EUR" | "GBP" | "AED" | "SGD" | "CNY" | "JPY",
      importDate: new Date(requiredText(formData, "importDate", "Import date")),
      notes: optionalText(formData, "notes")
    }
  });

  revalidateOperations();
}

export async function deleteImportBatch(formData: FormData) {
  await requireSignedIn();

  const id = requiredText(formData, "id", "Import batch");

  await prisma.$transaction(async (tx) => {
    const batch = await tx.importBatch.findUnique({
      where: { id },
      include: { _count: { select: { saleLines: true, adjustments: true } } }
    });

    if (!batch) throw new Error("Import batch not found.");
    if (batch._count.saleLines > 0 || batch._count.adjustments > 0) {
      throw new Error("Used or adjusted import batches cannot be deleted.");
    }

    await tx.stockMovement.deleteMany({ where: { importBatchId: id } });
    await tx.importBatch.delete({ where: { id } });
  });

  revalidateOperations();
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

export async function updateBuyer(formData: FormData) {
  await requireSignedIn();

  await prisma.buyer.update({
    where: { id: requiredText(formData, "id", "Buyer") },
    data: {
      name: requiredText(formData, "name", "Buyer name"),
      gstin: optionalText(formData, "gstin"),
      email: optionalText(formData, "email"),
      phone: optionalText(formData, "phone"),
      address: optionalText(formData, "address")
    }
  });

  revalidatePath("/sales");
  revalidatePath("/invoices");
}

export async function deleteBuyer(formData: FormData) {
  await requireSignedIn();

  const id = requiredText(formData, "id", "Buyer");
  const buyer = await prisma.buyer.findUnique({ where: { id }, include: { _count: { select: { sales: true } } } });

  if (!buyer) throw new Error("Buyer not found.");
  if (buyer._count.sales > 0) throw new Error("Buyers linked to sales cannot be deleted.");

  await prisma.buyer.delete({ where: { id } });
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

export async function updateSale(formData: FormData) {
  await requireSignedIn();

  const id = requiredText(formData, "id", "Sale");
  const gstRate = validNumber(formData, "gstRate", "GST rate");
  const quantityInput = text(formData, "quantityKg");
  const priceInput = text(formData, "saleUnitPrice");

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUniqueOrThrow({ where: { id }, include: { lines: true } });
    let subtotal = sale.subtotal;

    if (quantityInput || priceInput) {
      if (sale.lines.length !== 1) throw new Error("Quantity editing is only available for single-batch sales.");

      const line = sale.lines[0];
      const quantityKg = validNumber(formData, "quantityKg", "Quantity", 0.001);
      const saleUnitPrice = validNumber(formData, "saleUnitPrice", "Sale price");
      const batch = await tx.importBatch.findUniqueOrThrow({ where: { id: line.importBatchId } });
      const availableKg = batch.remainingKg.plus(line.quantityKg);

      if (availableKg.lessThan(decimal(quantityKg))) throw new Error("Not enough stock in this batch.");

      subtotal = decimal(quantityKg * saleUnitPrice);
      await tx.importBatch.update({ where: { id: batch.id }, data: { remainingKg: availableKg.minus(decimal(quantityKg)) } });
      await tx.saleLine.update({
        where: { id: line.id },
        data: { quantityKg: decimal(quantityKg), saleUnitPrice: decimal(saleUnitPrice), lineTotal: subtotal }
      });
      await tx.stockMovement.updateMany({
        where: { saleId: id, importBatchId: batch.id, type: StockMovementType.SALE },
        data: { quantityKg: decimal(quantityKg).negated() }
      });
    }

    const gstAmount = subtotal.mul(decimal(gstRate)).div(100);
    await tx.sale.update({
      where: { id },
      data: {
        buyerId: requiredText(formData, "buyerId", "Buyer"),
        saleDate: new Date(requiredText(formData, "saleDate", "Sale date")),
        paymentStatus: requiredText(formData, "paymentStatus", "Payment status") as "PAID" | "PENDING" | "PARTIAL",
        gstRate: decimal(gstRate),
        subtotal,
        gstAmount,
        totalAmount: subtotal.plus(gstAmount),
        notes: optionalText(formData, "notes")
      }
    });
  });

  revalidateOperations();
}

export async function deleteSale(formData: FormData) {
  await requireSignedIn();

  const id = requiredText(formData, "id", "Sale");

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id }, include: { lines: true } });
    if (!sale) throw new Error("Sale not found.");

    for (const line of sale.lines) {
      await tx.importBatch.update({ where: { id: line.importBatchId }, data: { remainingKg: { increment: line.quantityKg } } });
    }

    await tx.stockMovement.deleteMany({ where: { saleId: id } });
    await tx.sale.delete({ where: { id } });
  });

  revalidateOperations();
}

export async function updateInvoice(formData: FormData) {
  await requireSignedIn();

  await prisma.invoice.update({
    where: { id: requiredText(formData, "id", "Invoice") },
    data: {
      companyName: requiredText(formData, "companyName", "Company name"),
      companyGstin: requiredText(formData, "companyGstin", "Company GSTIN"),
      issuedAt: new Date(requiredText(formData, "issuedAt", "Issued date"))
    }
  });

  revalidatePath("/invoices");
}

export async function deleteInvoice(formData: FormData) {
  await requireSignedIn();
  await prisma.invoice.delete({ where: { id: requiredText(formData, "id", "Invoice") } });
  revalidatePath("/invoices");
  revalidatePath("/sales");
}

export async function createUser(formData: FormData) {
  await requireAdmin();

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

export async function updateUser(formData: FormData) {
  const currentUser = await requireAdmin();
  const id = requiredText(formData, "id", "User");
  const role = requiredText(formData, "role", "Role") as "ADMIN" | "STAFF";
  const target = await prisma.user.findUniqueOrThrow({ where: { id } });

  if (currentUser.id === id && role !== "ADMIN") throw new Error("You cannot remove your own admin access.");
  if (target.role === "ADMIN" && role !== "ADMIN" && (await prisma.user.count({ where: { role: "ADMIN" } })) <= 1) {
    throw new Error("At least one admin is required.");
  }

  await prisma.user.update({ where: { id }, data: { name: optionalText(formData, "name"), role } });
  revalidatePath("/dashboard");
}

export async function deleteUser(formData: FormData) {
  const currentUser = await requireAdmin();
  const id = requiredText(formData, "id", "User");

  if (currentUser.id === id) throw new Error("You cannot delete your own account.");

  const target = await prisma.user.findUniqueOrThrow({ where: { id } });
  if (target.role === "ADMIN" && (await prisma.user.count({ where: { role: "ADMIN" } })) <= 1) {
    throw new Error("The last admin cannot be deleted.");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/dashboard");
}
