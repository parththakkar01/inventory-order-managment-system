import { z } from "zod";

export const idSchema = z.string().min(1);

export const materialSchema = z.object({
  type: z.string().trim().min(1),
  grade: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  minimumStockKg: z.coerce.number().min(0).default(0)
});

export const supplierSchema = z.object({
  name: z.string().trim().min(1),
  country: z.string().trim().min(1),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable()
});

export const buyerSchema = z.object({
  name: z.string().trim().min(1),
  gstin: z.string().trim().min(1).optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable()
});

export const importBatchSchema = z.object({
  batchCode: z.string().trim().min(1),
  materialId: idSchema,
  supplierId: idSchema,
  quantityKg: z.coerce.number().positive(),
  countryOfOrigin: z.string().trim().min(1),
  purchaseUnitPrice: z.coerce.number().nonnegative(),
  purchaseTotal: z.coerce.number().nonnegative().optional(),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "SGD", "CNY", "JPY"]),
  importDate: z.coerce.date(),
  notes: z.string().trim().optional().nullable()
});

export const stockAdjustmentSchema = z.object({
  importBatchId: idSchema,
  type: z.enum(["DAMAGE", "RETURN", "CORRECTION", "OTHER"]),
  quantityKg: z.coerce.number().refine((value) => value !== 0, "Quantity cannot be zero."),
  reason: z.string().trim().min(1)
});

export const saleSchema = z.object({
  buyerId: idSchema,
  materialId: idSchema,
  saleDate: z.coerce.date(),
  paymentStatus: z.enum(["PAID", "PENDING", "PARTIAL"]).default("PENDING"),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "SGD", "CNY", "JPY"]).default("INR"),
  gstRate: z.coerce.number().min(0).max(100).default(18),
  notes: z.string().trim().optional().nullable(),
  lines: z
    .array(
      z.object({
        importBatchId: idSchema,
        quantityKg: z.coerce.number().positive(),
        saleUnitPrice: z.coerce.number().nonnegative()
      })
    )
    .min(1)
});

export const createUserSchema = z.object({
  name: z.string().trim().optional().nullable(),
  email: z.string().trim().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "STAFF"]).default("STAFF")
});
