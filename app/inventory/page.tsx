import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { adjustStock, createImportBatch, createMaterial, createSupplier, deleteMaterial } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [materials, suppliers] = await Promise.all([
    prisma.material.findMany({
      include: { imports: { include: { supplier: true }, orderBy: { importDate: "desc" } }, sales: true },
      orderBy: [{ type: "asc" }, { grade: "asc" }]
    }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } })
  ]);
  const batches = materials.flatMap((material) =>
    material.imports.map((batch) => ({
      id: batch.id,
      label: `${batch.batchCode} / ${material.type} ${material.grade} / ${toNumber(batch.remainingKg).toLocaleString("en-IN")} kg`
    }))
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AppShell>
      <PageHeader title="Inventory" eyebrow="Stock by material" />
      <section className="mb-8 grid gap-4 xl:grid-cols-2">
        <form action={createMaterial} className="rounded-2xl border border-white/10 bg-panel p-5 shadow-card">
          <h2 className="text-xl font-black">Add material</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="type" placeholder="Type, e.g. PP" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="grade" placeholder="Grade" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="minimumStockKg" type="number" min="0" step="0.001" placeholder="Minimum stock kg" />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent sm:col-span-2" name="description" placeholder="Description" />
          </div>
          <button className="mt-4 rounded-xl bg-accent px-5 py-3 font-black text-white transition hover:brightness-110">Add material</button>
        </form>
        <form action={createSupplier} className="rounded-2xl border border-white/10 bg-panel p-5 shadow-card">
          <h2 className="text-xl font-black">Add supplier</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="name" placeholder="Supplier name" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="country" placeholder="Country" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="email" type="email" placeholder="Email" />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="phone" placeholder="Phone" />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent sm:col-span-2" name="address" placeholder="Address" />
          </div>
          <button className="mt-4 rounded-xl bg-accent px-5 py-3 font-black text-white transition hover:brightness-110">Add supplier</button>
        </form>
      </section>
      <section className="mb-8 grid gap-4 xl:grid-cols-2">
        <form action={createImportBatch} className="rounded-2xl border border-white/10 bg-panel p-5 shadow-card">
          <h2 className="text-xl font-black">Add import batch</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="batchCode" placeholder="Batch code" required />
            <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="materialId" required>
              <option value="">Material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.type} {material.grade}
                </option>
              ))}
            </select>
            <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="supplierId" required>
              <option value="">Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="countryOfOrigin" placeholder="Country of origin" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="quantityKg" type="number" min="0" step="0.001" placeholder="Quantity kg" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="purchaseUnitPrice" type="number" min="0" step="0.01" placeholder="Price per kg" required />
            <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="currency" defaultValue="USD">
              {["INR", "USD", "EUR", "GBP", "AED", "SGD", "CNY", "JPY"].map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="importDate" type="date" defaultValue={today} required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent sm:col-span-2" name="notes" placeholder="Notes" />
          </div>
          <button className="mt-4 rounded-xl bg-accent px-5 py-3 font-black text-white transition hover:brightness-110">Add import</button>
        </form>
        <form action={adjustStock} className="rounded-2xl border border-white/10 bg-panel p-5 shadow-card">
          <h2 className="text-xl font-black">Adjust stock</h2>
          <div className="mt-4 grid gap-3">
            <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="importBatchId" required>
              <option value="">Batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.label}
                </option>
              ))}
            </select>
            <select className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="type" defaultValue="CORRECTION">
              <option value="DAMAGE">Damage</option>
              <option value="RETURN">Return</option>
              <option value="CORRECTION">Correction</option>
              <option value="OTHER">Other</option>
            </select>
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="quantityKg" type="number" step="0.001" placeholder="Quantity kg, use negative to reduce" required />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-accent" name="reason" placeholder="Reason" required />
          </div>
          <button className="mt-4 rounded-xl bg-accent px-5 py-3 font-black text-white transition hover:brightness-110">Adjust stock</button>
        </form>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {materials.map((material) => {
          const currentKg = material.imports.reduce((sum, batch) => sum + toNumber(batch.remainingKg), 0);
          const stockValue = material.imports.reduce(
            (sum, batch) => sum + toNumber(batch.remainingKg) * toNumber(batch.purchaseUnitPrice),
            0
          );

          return (
            <div
              key={material.id}
              className={`rounded-2xl border bg-panel p-5 shadow-card ${
                currentKg < toNumber(material.minimumStockKg) ? "border-amber-400/50" : "border-white/10"
              }`}
            >
              <p className="text-sm font-medium text-muted">
                {material.type} / {material.grade}
              </p>
              <p className="mt-3 text-3xl font-black tracking-normal">{currentKg.toLocaleString("en-IN")} kg</p>
              <p className="mt-2 text-sm text-muted">Value Rs {stockValue.toLocaleString("en-IN")}</p>
              {material.imports.length === 0 && material.sales.length === 0 ? (
                <form action={deleteMaterial} className="mt-3">
                  <input type="hidden" name="id" value={material.id} />
                  <button className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-muted transition hover:border-accent hover:text-white">
                    Delete material
                  </button>
                </form>
              ) : null}
            </div>
          );
        })}
      </section>
      <section className="mt-8 rounded-2xl border border-white/10 bg-panel shadow-card">
        <div className="grid grid-cols-5 gap-4 border-b border-white/10 px-5 py-4 text-sm font-bold text-muted">
          <span>Batch</span>
          <span>Material</span>
          <span>Supplier</span>
          <span>Remaining</span>
          <span>Import date</span>
        </div>
        {materials.flatMap((material) =>
          material.imports.map((batch) => (
            <div key={batch.id} className="grid grid-cols-5 gap-4 border-b border-white/5 px-5 py-4 text-sm">
              <span className="font-bold">{batch.batchCode}</span>
              <span>
                {material.type} {material.grade}
              </span>
              <span className="text-muted">{batch.supplier.name}</span>
              <span>{toNumber(batch.remainingKg).toLocaleString("en-IN")} kg</span>
              <span className="text-muted">{batch.importDate.toLocaleDateString("en-IN")}</span>
            </div>
          ))
        )}
      </section>
    </AppShell>
  );
}
