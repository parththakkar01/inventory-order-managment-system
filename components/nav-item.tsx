"use client";

import { Boxes, FileText, Gauge, ReceiptText, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = {
  dashboard: Gauge,
  inventory: Boxes,
  sales: ShoppingCart,
  invoices: ReceiptText,
  reports: FileText
};

export function NavItem({ href, label, icon }: { href: string; label: string; icon: keyof typeof icons }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = icons[icon];

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition md:flex-row md:justify-start md:gap-3 md:px-3 md:py-3 md:text-sm ${
        active ? "bg-accent text-white shadow-card" : "text-muted hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 md:h-4 md:w-4" />
      <span>{label}</span>
    </Link>
  );
}
