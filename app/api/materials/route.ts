import { NextResponse } from "next/server";

import { requireUser, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { materialSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const materials = await prisma.material.findMany({
    where: q
      ? {
          OR: [
            { type: { contains: q, mode: "insensitive" } },
            { grade: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined,
    orderBy: [{ type: "asc" }, { grade: "asc" }]
  });

  return NextResponse.json({ materials });
}

export async function POST(request: Request) {
  const { error } = await requireUser();
  if (error) return error;

  const parsed = materialSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid material.");

  const material = await prisma.material.create({ data: parsed.data });

  return NextResponse.json({ material }, { status: 201 });
}
