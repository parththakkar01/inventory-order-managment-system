import { NextResponse } from "next/server";

import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validators";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });

  return NextResponse.json({ suppliers });
}

export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const parsed = supplierSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid supplier.");

  const supplier = await prisma.supplier.create({ data: parsed.data });

  return NextResponse.json({ supplier }, { status: 201 });
}
