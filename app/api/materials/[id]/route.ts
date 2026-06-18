import { NextResponse } from "next/server";

import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { materialSchema } from "@/lib/validators";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  const parsed = materialSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid material.");

  const material = await prisma.material.update({ where: { id }, data: parsed.data });

  return NextResponse.json({ material });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireUser();
  if (error) return error;

  const { id } = await params;
  await prisma.material.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
