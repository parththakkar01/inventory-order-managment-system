import type { ReactNode } from "react";

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
    <div className="min-h-screen bg-ink text-white">
      <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-panel/95 backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-64 md:border-r md:border-t-0">
        <div className="hidden px-6 py-7 md:block">
          <p className="text-xs uppercase tracking-[0.28em] text-muted">Import desk</p>
          <h1 className="mt-2 text-2xl font-black">Reseptionist</h1>
        </div>
        <nav className="grid grid-cols-5 gap-1 p-2 md:block md:space-y-1 md:px-3">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="hidden p-3 md:block"
        >
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted transition hover:bg-white/5 hover:text-white">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 17l5-5-5-5m5 5H3m12-8h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" />
            </svg>
            Sign out
          </button>
        </form>
      </aside>
      <div className="pb-24 md:ml-64 md:pb-0">
        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
