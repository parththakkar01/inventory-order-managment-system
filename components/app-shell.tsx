import type { ReactNode } from "react";
import Link from "next/link";

import { signOut } from "@/auth";
import { NavItem } from "@/components/nav-item";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/inventory", label: "Inventory", icon: "inventory" },
  { href: "/sales", label: "Sales", icon: "sales" },
  { href: "/invoices", label: "Invoices", icon: "invoices" },
  { href: "/reports", label: "Reports", icon: "reports" }
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-[#f5f3f8]">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0e0e11]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-sm font-black text-white shadow-card">
              R
            </span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-muted">Import desk</span>
              <span className="block text-lg font-black tracking-tight">Reseptionist</span>
            </span>
          </Link>
          <nav className="mx-auto hidden items-center gap-1 rounded-2xl bg-white/[0.05] p-1.5 md:flex">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="ml-auto"
          >
            <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-bold text-[#d9d6df] transition hover:border-accent/30 hover:bg-accent-soft hover:text-[#c8b8ff] sm:px-4">
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5m5 5H3m12-8h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" />
              </svg>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </header>
      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-1 rounded-[24px] border border-white/[0.08] bg-[#151518]/95 p-2 shadow-float backdrop-blur-xl md:hidden">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>
      <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-7xl px-4 py-7 pb-28 sm:px-6 sm:py-10 lg:px-8 md:pb-10">
        {children}
      </main>
    </div>
  );
}
