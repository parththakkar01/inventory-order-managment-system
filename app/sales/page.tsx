import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader } from "@/components/page-header";
import { createBuyer, createSale, deleteBuyer, deleteSale, updateBuyer, updateSale } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [sales, buyers, batches] = await Promise.all([
    prisma.sale.findMany({
      include: { buyer: true, material: true, invoice: true, lines: true },
      orderBy: { saleDate: "desc" }
    }),
    prisma.buyer.findMany({ include: { _count: { select: { sales: true } } }, orderBy: { name: "asc" } }),
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
        <form action={createBuyer} className="district-card p-6">
          <h2 className="text-xl font-black">Add buyer</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="district-field" name="name" placeholder="Buyer company" required />
            <input className="district-field" name="gstin" placeholder="GSTIN" />
            <input className="district-field" name="email" type="email" placeholder="Email" />
            <input className="district-field" name="phone" placeholder="Phone" />
            <input className="district-field sm:col-span-2" name="address" placeholder="Address" />
          </div>
          <button className="mt-4 district-button">Add buyer</button>
        </form>
        <form action={createSale} className="district-card p-6">
          <h2 className="text-xl font-black">Record sale</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select className="district-field" name="buyerId" required>
              <option value="">Buyer</option>
              {buyers.map((buyer) => (
                <option key={buyer.id} value={buyer.id}>
                  {buyer.name}
                </option>
              ))}
            </select>
            <select className="district-field" name="importBatchId" required>
              <option value="">Stock batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchCode} / {batch.material.type} {batch.material.grade} / {toNumber(batch.remainingKg).toLocaleString("en-IN")} kg
                </option>
              ))}
            </select>
            <input className="district-field" name="quantityKg" type="number" min="0" step="0.001" placeholder="Quantity kg" required />
            <input className="district-field" name="saleUnitPrice" type="number" min="0" step="0.01" placeholder="Sale price per kg" required />
            <input className="district-field" name="gstRate" type="number" min="0" max="100" step="0.01" defaultValue="18" placeholder="GST %" />
            <select className="district-field" name="paymentStatus" defaultValue="PENDING">
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
            <input className="district-field" name="saleDate" type="date" defaultValue={today} required />
            <input className="district-field" name="notes" placeholder="Notes" />
          </div>
          <button className="mt-4 district-button">Record sale</button>
        </form>
      </section>
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-2xl font-black tracking-tight">Buyers</h2>
          <p className="mt-1 text-sm text-muted">Keep customer details current or remove buyers without sales.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {buyers.map((buyer) => (
            <article key={buyer.id} className="district-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">{buyer.name}</h3>
                  <p className="mt-1 text-sm text-muted">{buyer.gstin || "No GSTIN"}</p>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-[#bba8ff]">{buyer._count.sales} sales</span>
              </div>
              <details className="mt-4">
                <summary className="district-subtle-button inline-flex cursor-pointer list-none">Edit buyer</summary>
                <form action={updateBuyer} className="district-editor grid gap-3">
                  <input type="hidden" name="id" value={buyer.id} />
                  <input className="district-field" name="name" defaultValue={buyer.name} required />
                  <input className="district-field" name="gstin" defaultValue={buyer.gstin ?? ""} placeholder="GSTIN" />
                  <input className="district-field" name="email" type="email" defaultValue={buyer.email ?? ""} placeholder="Email" />
                  <input className="district-field" name="phone" defaultValue={buyer.phone ?? ""} placeholder="Phone" />
                  <input className="district-field" name="address" defaultValue={buyer.address ?? ""} placeholder="Address" />
                  <button className="district-button">Save buyer</button>
                </form>
              </details>
              {buyer._count.sales === 0 ? (
                <form action={deleteBuyer} className="mt-3">
                  <input type="hidden" name="id" value={buyer.id} />
                  <ConfirmSubmitButton message={`Delete buyer ${buyer.name}?`}>Delete buyer</ConfirmSubmitButton>
                </form>
              ) : <p className="mt-3 text-xs font-semibold text-muted">Deletion locked: buyer has sales history.</p>}
            </article>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        {sales.map((sale) => (
          <article key={sale.id} className="district-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-muted">Sale #{sale.saleNumber}</p>
                <h2 className="mt-1 text-2xl font-black">{sale.buyer.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {sale.material.type} {sale.material.grade} / {sale.saleDate.toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-black">Rs {toNumber(sale.totalAmount).toLocaleString("en-IN")}</p>
                <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${sale.paymentStatus === "PAID" ? "bg-emerald-300/10 text-emerald-300" : sale.paymentStatus === "PARTIAL" ? "bg-amber-300/10 text-amber-300" : "bg-accent-soft text-[#bba8ff]"}`}>
                  {sale.paymentStatus}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <details>
                <summary className="district-subtle-button inline-flex cursor-pointer list-none">Edit sale</summary>
                <form action={updateSale} className="district-editor grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={sale.id} />
                  <select className="district-field sm:col-span-2" name="buyerId" defaultValue={sale.buyerId} required>
                    {buyers.map((buyer) => <option key={buyer.id} value={buyer.id}>{buyer.name}</option>)}
                  </select>
                  {sale.lines.length === 1 ? (
                    <>
                      <input className="district-field" name="quantityKg" type="number" min="0.001" step="0.001" defaultValue={toNumber(sale.lines[0].quantityKg)} required />
                      <input className="district-field" name="saleUnitPrice" type="number" min="0" step="0.01" defaultValue={toNumber(sale.lines[0].saleUnitPrice)} required />
                    </>
                  ) : null}
                  <input className="district-field" name="gstRate" type="number" min="0" max="100" step="0.01" defaultValue={toNumber(sale.gstRate)} required />
                  <select className="district-field" name="paymentStatus" defaultValue={sale.paymentStatus}>
                    <option value="PENDING">Pending</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PAID">Paid</option>
                  </select>
                  <input className="district-field" name="saleDate" type="date" defaultValue={sale.saleDate.toISOString().slice(0, 10)} required />
                  <input className="district-field" name="notes" defaultValue={sale.notes ?? ""} placeholder="Notes" />
                  <button className="district-button sm:col-span-2">Save sale</button>
                </form>
              </details>
              <form action={deleteSale}>
                <input type="hidden" name="id" value={sale.id} />
                <ConfirmSubmitButton message={`Delete sale #${sale.saleNumber}? Stock will be restored.`}>Delete sale</ConfirmSubmitButton>
              </form>
            </div>
          </article>
        ))}
        {sales.length === 0 ? <div className="rounded-[28px] border border-dashed border-white/10 bg-panel p-8 text-muted">No sales recorded yet.</div> : null}
      </section>
    </AppShell>
  );
}
