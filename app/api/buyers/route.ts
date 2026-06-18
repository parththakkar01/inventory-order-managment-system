import { NextResponse } from "next/server";

import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { buyerSchema } from "@/lib/validators";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const buyers = await prisma.buyer.findMany({ orderBy: { name: "asc" } });

  return NextResponse.json({ buyers });
}

export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const parsed = buyerSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid buyer.");

  const buyer = await prisma.buyer.create({ data: parsed.data });

  return NextResponse.json({ buyer }, { status: 201 });
}
