import { Prisma } from "@prisma/client";

export function decimal(value: number) {
  return new Prisma.Decimal(value.toString());
}

export function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) {
    return 0;
  }

  return Number(value);
}
