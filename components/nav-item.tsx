"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icons = ["dashboard", "inventory", "sales", "invoices", "reports"] as const;
type IconName = (typeof icons)[number];

const iconPaths: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <path d="M4 13a8 8 0 1116 0" />
      <path d="M12 13l3-3M4 17h16" />
    </>
  ),
  inventory: (
    <>
      <path d="M4 7l8-4 8 4-8 4-8-4zM4 7v10l8 4 8-4V7M12 11v10" />
    </>
  ),
  sales: (
    <>
      <path d="M3 4h2l2 11h10l3-7H6" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="17" cy="19" r="1" />
    </>
  ),
  invoices: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  reports: (
    <>
      <path d="M6 3h9l3 3v15H6V3zM15 3v4h4" />
      <path d="M9 12h6M9 16h6" />
    </>
  )
};

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 md:h-4 md:w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {iconPaths[name]}
    </svg>
  );
}

export function NavItem({ href, label, icon }: { href: string; label: string; icon: IconName }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition md:flex-row md:justify-start md:gap-3 md:px-3 md:py-3 md:text-sm ${
        active ? "bg-accent text-white shadow-card" : "text-muted hover:bg-white/5 hover:text-white"
      }`}
    >
      <NavIcon name={icon} />
      <span>{label}</span>
    </Link>
  );
}
