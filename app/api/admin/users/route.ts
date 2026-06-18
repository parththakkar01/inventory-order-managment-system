import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireAdmin, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = createUserSchema.safeParse(await request.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid user.");

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true
    }
  });

  return NextResponse.json({ user }, { status: 201 });
}
