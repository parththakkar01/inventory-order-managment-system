import { auth } from "@/auth";
import { createUser, deleteImportBatch, deleteUser, updateImportBatch, updateUser } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [materials, monthlySales, recentImports, users] = await Promise.all([
    prisma.material.findMany({ include: { imports: true } }),
    prisma.sale.findMany({
      where: { saleDate: { gte: monthStart } },
      include: { lines: { include: { importBatch: true } } }
    }),
    prisma.importBatch.findMany({
      include: { material: true, supplier: true, _count: { select: { saleLines: true, adjustments: true } } },
      orderBy: { importDate: "desc" },
      take: 8
    }),
    session?.user.role === "ADMIN"
      ? prisma.user.findMany({ orderBy: [{ role: "asc" }, { createdAt: "asc" }] })
      : Promise.resolve([])
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
        <div className="mb-6 flex items-center gap-3 rounded-[24px] border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm font-semibold text-amber-100">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-300/15 text-amber-300">!</span>
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
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Recent imports</h2>
            <p className="mt-1 text-sm text-muted">Latest batches added to your inventory</p>
          </div>
          <span className="rounded-full bg-panel px-3 py-1.5 text-xs font-bold text-muted shadow-card">{recentImports.length} batches</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {recentImports.map((batch) => (
            <article key={batch.id} className="min-w-72 district-card p-6">
              <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">{batch.batchCode}</p>
              <h3 className="mt-2 text-xl font-black">
                {batch.material.type} {batch.material.grade}
              </h3>
              <p className="mt-3 text-sm text-muted">{batch.supplier.name}</p>
              <p className="mt-4 text-3xl font-black">{toNumber(batch.remainingKg).toLocaleString("en-IN")} kg</p>
              <details className="mt-4">
                <summary className="district-subtle-button inline-flex cursor-pointer list-none">Edit batch</summary>
                <form action={updateImportBatch} className="district-editor grid w-64 gap-2">
                  <input type="hidden" name="id" value={batch.id} />
                  <input type="hidden" name="supplierId" value={batch.supplierId} />
                  <input className="district-field" name="batchCode" defaultValue={batch.batchCode} required />
                  <input className="district-field" name="countryOfOrigin" defaultValue={batch.countryOfOrigin} required />
                  <input className="district-field" name="purchaseUnitPrice" type="number" min="0" step="0.01" defaultValue={toNumber(batch.purchaseUnitPrice)} required />
                  <select className="district-field" name="currency" defaultValue={batch.currency}>
                    {['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CNY', 'JPY'].map((currency) => <option key={currency}>{currency}</option>)}
                  </select>
                  <input className="district-field" name="importDate" type="date" defaultValue={batch.importDate.toISOString().slice(0, 10)} required />
                  <input className="district-field" name="notes" defaultValue={batch.notes ?? ""} placeholder="Notes" />
                  <button className="district-button">Save batch</button>
                </form>
              </details>
              {batch._count.saleLines === 0 && batch._count.adjustments === 0 ? (
                <form action={deleteImportBatch} className="mt-3">
                  <input type="hidden" name="id" value={batch.id} />
                  <ConfirmSubmitButton message={`Delete batch ${batch.batchCode}?`}>Delete batch</ConfirmSubmitButton>
                </form>
              ) : <p className="mt-3 text-xs font-semibold text-muted">Deletion locked: batch was used or adjusted.</p>}
            </article>
          ))}
          {recentImports.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-panel p-8 text-muted">No imports recorded yet.</div>
          ) : null}
        </div>
      </section>
      {session?.user.role === "ADMIN" ? (
        <section className="mt-8 space-y-4">
          <div className="district-card p-6">
            <h2 className="text-xl font-black">Create staff user</h2>
            <p className="mt-1 text-sm text-muted">Invite a teammate with the right level of access.</p>
            <form action={createUser} className="mt-4 grid gap-3 md:grid-cols-5">
              <input className="district-field" name="name" placeholder="Name" />
              <input className="district-field" name="email" type="email" placeholder="Email" required />
              <input className="district-field" name="password" type="password" placeholder="Password" minLength={8} required />
              <select className="district-field" name="role" defaultValue="STAFF">
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button className="district-button">Create user</button>
            </form>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {users.map((user) => (
              <article key={user.id} className="district-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{user.name || "Unnamed user"}</h3>
                    <p className="mt-1 text-sm text-muted">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-[#bba8ff]">{user.role}</span>
                </div>
                <details className="mt-4">
                  <summary className="district-subtle-button inline-flex cursor-pointer list-none">Edit user</summary>
                  <form action={updateUser} className="district-editor grid gap-3">
                    <input type="hidden" name="id" value={user.id} />
                    <input className="district-field" name="name" defaultValue={user.name ?? ""} placeholder="Name" />
                    <select className="district-field" name="role" defaultValue={user.role}>
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button className="district-button">Save user</button>
                  </form>
                </details>
                {user.id !== session.user.id ? (
                  <form action={deleteUser} className="mt-3">
                    <input type="hidden" name="id" value={user.id} />
                    <ConfirmSubmitButton message={`Delete user ${user.email}?`}>Delete user</ConfirmSubmitButton>
                  </form>
                ) : <p className="mt-3 text-xs font-semibold text-muted">This is your current account.</p>}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
