import { NextResponse } from "next/server";

import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      sale: {
        include: {
          buyer: true,
          material: true,
          lines: { include: { importBatch: true } }
        }
      }
    }
  });

  if (!invoice) {
    return jsonError("Invoice not found.", 404);
  }

  return NextResponse.json({ invoice });
}
