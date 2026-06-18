import { NextResponse } from "next/server";

import { requireUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const invoices = await prisma.invoice.findMany({
    include: {
      sale: {
        include: {
          buyer: true,
          material: true,
          lines: { include: { importBatch: true } }
        }
      }
    },
    orderBy: { issuedAt: "desc" }
  });

  return NextResponse.json({ invoices });
}
