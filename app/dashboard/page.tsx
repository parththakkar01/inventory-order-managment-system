import { auth } from "@/auth";
import { createUser } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [materials, monthlySales, recentImports] = await Promise.all([
    prisma.material.findMany({ include: { imports: true } }),
    prisma.sale.findMany({
      where: { saleDate: { gte: monthStart } },
      include: { lines: { include: { importBatch: true } } }
    }),
    prisma.importBatch.findMany({
      include: { material: true, supplier: true },
      orderBy: { importDate: "desc" },
      take: 8
    })
  ]);

  const totalStockValue = materials.reduce((sum, material) => {
    return (
      sum +
      material.imports.reduce((batchSum, batch) => {
        return batchSum + toNumber(batch.remainingKg) * toNumber(batch.purchaseUnitPrice);
      }, 0)
    );
  }, 0);
  const totalSales = monthlySales.reduce((sum, sale) => sum + toNumber(sale.totalAmount), 0);
  const profit = monthlySales.reduce((sum, sale) => {
    const cost = sale.lines.reduce((lineSum, line) => {
      return lineSum + toNumber(line.quantityKg) * toNumber(line.importBatch.purchaseUnitPrice);
    }, 0);

    return sum + toNumber(sale.subtotal) - cost;
  }, 0);
  const lowStockCount = materials.filter((material) => {
    const currentKg = material.imports.reduce((sum, batch) => sum + toNumber(batch.remainingKg), 0);
    return currentKg < toNumber(material.minimumStockKg);
  }).length;

  return (
    <AppShell>
      <PageHeader title="Dashboard" eyebrow={`Signed in as ${session?.user?.email ?? "staff"}`} />
      {lowStockCount > 0 ? (
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-sm font-semibold text-amber-100">
          {lowStockCount} material{lowStockCount === 1 ? "" : "s"} below minimum stock.
        </div>
      ) : null}
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total stock value" value={`Rs ${totalStockValue.toLocaleString("en-IN")}`} />
        <MetricCard label="Sales this month" value={`Rs ${totalSales.toLocaleString("en-IN")}`} tone="accent" />
        <MetricCard
          label="Profit this month"
          value={session?.user.role === "ADMIN" ? `Rs ${profit.toLocaleString("en-IN")}` : "Hidden"}
          detail={session?.user.role === "ADMIN" ? "Visible to admins" : "Admin-only metric"}
        />
        <MetricCard label="Low-stock items" value={lowStockCount} tone={lowStockCount > 0 ? "warning" : "default"} />
      </section>
      <section className="mt-8">
        <h2 className="mb-4 text-2xl font-black">Recent imports</h2>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {recentImports.map((batch) => (
            <article key={batch.id} className="min-w-72 rounded-2xl border border-white/10 bg-panel p-5 shadow-card">
              <p className="text-sm text-muted">{batch.batchCode}</p>
              <h3 className="mt-2 text-xl font-black">
                {batch.material.type} {batch.material.grade}
              </h3>
              <p className="mt-3 text-sm text-muted">{batch.supplier.name}</p>
              <p className="mt-4 text-3xl font-black">{toNumber(batch.remainingKg).toLocaleString("en-IN")} kg</p>
            </article>
          ))}
          {recentImports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-muted">No imports recorded yet.</div>
          ) : null}
        </div>
      </section>
      {session?.user.role === "ADMIN" ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-panel p-5 shadow-card">
          <h2 className="text-xl font-black">Create staff user</h2>
          <form action={createUser} className="mt-4 grid gap-3 md:grid-cols-5">
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="name" placeholder="Name" />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="email" type="email" placeholder="Email" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="password" type="password" placeholder="Password" minLength={8} required />
            <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="role" defaultValue="STAFF">
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button className="rounded-xl bg-accent px-5 py-3 font-black text-white transition hover:brightness-110">Create user</button>
          </form>
        </section>
      ) : null}
    </AppShell>
  );
}
