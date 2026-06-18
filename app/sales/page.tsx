import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { createBuyer, createSale } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [sales, buyers, batches] = await Promise.all([
    prisma.sale.findMany({
      include: { buyer: true, material: true, invoice: true, lines: true },
      orderBy: { saleDate: "desc" }
    }),
    prisma.buyer.findMany({ orderBy: { name: "asc" } }),
    prisma.importBatch.findMany({
      where: { remainingKg: { gt: 0 } },
      include: { material: true, supplier: true },
      orderBy: { importDate: "desc" }
    })
  ]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell>
      <PageHeader title="Sales" eyebrow="Customer orders" />
      <section className="mb-8 grid gap-4 xl:grid-cols-2">
        <form action={createBuyer} className="rounded-2xl border border-white/10 bg-panel p-5 shadow-card">
          <h2 className="text-xl font-black">Add buyer</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="name" placeholder="Buyer company" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="gstin" placeholder="GSTIN" />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="email" type="email" placeholder="Email" />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="phone" placeholder="Phone" />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent sm:col-span-2" name="address" placeholder="Address" />
          </div>
          <button className="mt-4 rounded-xl bg-accent px-5 py-3 font-black text-white transition hover:brightness-110">Add buyer</button>
        </form>
        <form action={createSale} className="rounded-2xl border border-white/10 bg-panel p-5 shadow-card">
          <h2 className="text-xl font-black">Record sale</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="buyerId" required>
              <option value="">Buyer</option>
              {buyers.map((buyer) => (
                <option key={buyer.id} value={buyer.id}>
                  {buyer.name}
                </option>
              ))}
            </select>
            <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="importBatchId" required>
              <option value="">Stock batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchCode} / {batch.material.type} {batch.material.grade} / {toNumber(batch.remainingKg).toLocaleString("en-IN")} kg
                </option>
              ))}
            </select>
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="quantityKg" type="number" min="0" step="0.001" placeholder="Quantity kg" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="saleUnitPrice" type="number" min="0" step="0.01" placeholder="Sale price per kg" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="gstRate" type="number" min="0" max="100" step="0.01" defaultValue="18" placeholder="GST %" />
            <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="paymentStatus" defaultValue="PENDING">
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="saleDate" type="date" defaultValue={today} required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="notes" placeholder="Notes" />
          </div>
          <button className="mt-4 rounded-xl bg-accent px-5 py-3 font-black text-white transition hover:brightness-110">Record sale</button>
        </form>
      </section>
      <section className="space-y-4">
        {sales.map((sale) => (
          <article key={sale.id} className="rounded-2xl border border-white/10 bg-panel p-5 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-muted">Sale #{sale.saleNumber}</p>
                <h2 className="mt-1 text-2xl font-black">{sale.buyer.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {sale.material.type} {sale.material.grade} • {sale.saleDate.toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-black">Rs {toNumber(sale.totalAmount).toLocaleString("en-IN")}</p>
                <p className="mt-1 text-sm font-bold text-accent">{sale.paymentStatus}</p>
              </div>
            </div>
          </article>
        ))}
        {sales.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-8 text-muted">No sales recorded yet.</div> : null}
      </section>
    </AppShell>
  );
}
