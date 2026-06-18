import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { auth } from "@/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: jsonError("You must be signed in.", 401), user: null };
  }

  return { error: null, user: session.user };
}

export async function requireAdmin() {
  const result = await requireUser();

  if (result.error) {
    return result;
  }

  if (result.user.role !== Role.ADMIN) {
    return { error: jsonError("Admin access is required.", 403), user: null };
  }

  return result;
}
