import { NextResponse } from "next/server";

import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/stock";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const materials = await prisma.material.findMany({
    include: {
      imports: {
        include: { supplier: true },
        orderBy: { importDate: "desc" }
      }
    },
    orderBy: [{ type: "asc" }, { grade: "asc" }]
  });

  const stock = materials.map((material) => {
    const currentKg = material.imports.reduce((sum, batch) => sum + toNumber(batch.remainingKg), 0);
    const stockValue = material.imports.reduce((sum, batch) => {
      return sum + toNumber(batch.remainingKg) * toNumber(batch.purchaseUnitPrice);
    }, 0);

    return {
      id: material.id,
      type: material.type,
      grade: material.grade,
      minimumStockKg: toNumber(material.minimumStockKg),
      currentKg,
      stockValue,
      isLowStock: currentKg < toNumber(material.minimumStockKg),
      batches: material.imports
    };
  });

  return NextResponse.json({ stock });
}
