import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader } from "@/components/page-header";
import {
  adjustStock,
  createImportBatch,
  createMaterial,
  createSupplier,
  deleteImportBatch,
  deleteMaterial,
  deleteSupplier,
  updateImportBatch,
  updateMaterial,
  updateSupplier
} from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [materials, suppliers] = await Promise.all([
    prisma.material.findMany({
      include: {
        imports: {
          include: { supplier: true, _count: { select: { saleLines: true, adjustments: true } } },
          orderBy: { importDate: "desc" }
        },
        sales: true
      },
      orderBy: [{ type: "asc" }, { grade: "asc" }]
    }),
    prisma.supplier.findMany({ include: { _count: { select: { imports: true } } }, orderBy: { name: "asc" } })
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
        <form action={createMaterial} className="district-card p-6">
          <h2 className="text-xl font-black">Add material</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="district-field" name="type" placeholder="Type, e.g. PP" required />
            <input className="district-field" name="grade" placeholder="Grade" required />
            <input className="district-field" name="minimumStockKg" type="number" min="0" step="0.001" placeholder="Minimum stock kg" />
            <input className="district-field sm:col-span-2" name="description" placeholder="Description" />
          </div>
          <button className="mt-4 district-button">Add material</button>
        </form>
        <form action={createSupplier} className="district-card p-6">
          <h2 className="text-xl font-black">Add supplier</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="district-field" name="name" placeholder="Supplier name" required />
            <input className="district-field" name="country" placeholder="Country" required />
            <input className="district-field" name="email" type="email" placeholder="Email" />
            <input className="district-field" name="phone" placeholder="Phone" />
            <input className="district-field sm:col-span-2" name="address" placeholder="Address" />
          </div>
          <button className="mt-4 district-button">Add supplier</button>
        </form>
      </section>
      <section className="mb-8 grid gap-4 xl:grid-cols-2">
        <form action={createImportBatch} className="district-card p-6">
          <h2 className="text-xl font-black">Add import batch</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input className="district-field" name="batchCode" placeholder="Batch code" required />
            <select className="district-field" name="materialId" required>
              <option value="">Material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.type} {material.grade}
                </option>
              ))}
            </select>
            <select className="district-field" name="supplierId" required>
              <option value="">Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <input className="district-field" name="countryOfOrigin" placeholder="Country of origin" required />
            <input className="district-field" name="quantityKg" type="number" min="0" step="0.001" placeholder="Quantity kg" required />
            <input className="district-field" name="purchaseUnitPrice" type="number" min="0" step="0.01" placeholder="Price per kg" required />
            <select className="district-field" name="currency" defaultValue="USD">
              {["INR", "USD", "EUR", "GBP", "AED", "SGD", "CNY", "JPY"].map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
            <input className="district-field" name="importDate" type="date" defaultValue={today} required />
            <input className="district-field sm:col-span-2" name="notes" placeholder="Notes" />
          </div>
          <button className="mt-4 district-button">Add import</button>
        </form>
        <form action={adjustStock} className="district-card p-6">
          <h2 className="text-xl font-black">Adjust stock</h2>
          <div className="mt-4 grid gap-3">
            <select className="district-field" name="importBatchId" required>
              <option value="">Batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.label}
                </option>
              ))}
            </select>
            <select className="district-field" name="type" defaultValue="CORRECTION">
              <option value="DAMAGE">Damage</option>
              <option value="RETURN">Return</option>
              <option value="CORRECTION">Correction</option>
              <option value="OTHER">Other</option>
            </select>
            <input className="district-field" name="quantityKg" type="number" step="0.001" placeholder="Quantity kg, use negative to reduce" required />
            <input className="district-field" name="reason" placeholder="Reason" required />
          </div>
          <button className="mt-4 district-button">Adjust stock</button>
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
              className={`rounded-[28px] border bg-panel p-6 shadow-card ${
                currentKg < toNumber(material.minimumStockKg) ? "border-amber-300/30" : "border-white/[0.07]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-muted">{material.type} / {material.grade}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${currentKg < toNumber(material.minimumStockKg) ? "bg-amber-300/10 text-amber-300" : "bg-emerald-300/10 text-emerald-300"}`}>
                  {currentKg < toNumber(material.minimumStockKg) ? "Low stock" : "In stock"}
                </span>
              </div>
              <p className="mt-3 text-3xl font-black tracking-normal">{currentKg.toLocaleString("en-IN")} kg</p>
              <p className="mt-2 text-sm text-muted">Value Rs {stockValue.toLocaleString("en-IN")}</p>
              <details className="mt-4">
                <summary className="district-subtle-button inline-flex cursor-pointer list-none">Edit material</summary>
                <form action={updateMaterial} className="district-editor grid gap-3">
                  <input type="hidden" name="id" value={material.id} />
                  <input className="district-field" name="type" defaultValue={material.type} required />
                  <input className="district-field" name="grade" defaultValue={material.grade} required />
                  <input className="district-field" name="minimumStockKg" type="number" min="0" step="0.001" defaultValue={toNumber(material.minimumStockKg)} required />
                  <input className="district-field" name="description" defaultValue={material.description ?? ""} placeholder="Description" />
                  <button className="district-button">Save material</button>
                </form>
              </details>
              <form action={deleteMaterial} className="mt-3">
                <input type="hidden" name="id" value={material.id} />
                <ConfirmSubmitButton message={`Delete ${material.type} ${material.grade}? This will also delete its ${material.imports.length} batches, ${material.sales.length} sales, related invoices and stock history.`}>
                  Delete material
                </ConfirmSubmitButton>
              </form>
            </div>
          );
        })}
      </section>
      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-2xl font-black tracking-tight">Suppliers</h2>
          <p className="mt-1 text-sm text-muted">Edit contact details or remove suppliers that have no imports.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <article key={supplier.id} className="district-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">{supplier.name}</h3>
                  <p className="mt-1 text-sm text-muted">{supplier.country}</p>
                </div>
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-[#bba8ff]">{supplier._count.imports} imports</span>
              </div>
              <p className="mt-4 text-sm text-muted">{supplier.email || supplier.phone || "No contact details"}</p>
              <details className="mt-4">
                <summary className="district-subtle-button inline-flex cursor-pointer list-none">Edit supplier</summary>
                <form action={updateSupplier} className="district-editor grid gap-3">
                  <input type="hidden" name="id" value={supplier.id} />
                  <input className="district-field" name="name" defaultValue={supplier.name} required />
                  <input className="district-field" name="country" defaultValue={supplier.country} required />
                  <input className="district-field" name="email" type="email" defaultValue={supplier.email ?? ""} placeholder="Email" />
                  <input className="district-field" name="phone" defaultValue={supplier.phone ?? ""} placeholder="Phone" />
                  <input className="district-field" name="address" defaultValue={supplier.address ?? ""} placeholder="Address" />
                  <button className="district-button">Save supplier</button>
                </form>
              </details>
              <form action={deleteSupplier} className="mt-3">
                <input type="hidden" name="id" value={supplier.id} />
                <ConfirmSubmitButton message={`Delete supplier ${supplier.name}? This will also delete ${supplier._count.imports} import batches, affected sales, invoices and stock history.`}>
                  Delete supplier
                </ConfirmSubmitButton>
              </form>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-8 overflow-x-auto rounded-[28px] border border-white/[0.07] bg-panel shadow-card">
        <div className="grid min-w-[960px] grid-cols-6 gap-4 border-b border-white/[0.07] bg-white/[0.025] px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-muted">
          <span>Batch</span>
          <span>Material</span>
          <span>Supplier</span>
          <span>Remaining</span>
          <span>Import date</span>
          <span>Actions</span>
        </div>
        {materials.flatMap((material) =>
          material.imports.map((batch) => (
            <div key={batch.id} className="grid min-w-[960px] grid-cols-6 items-start gap-4 border-b border-white/[0.06] px-6 py-4 text-sm transition hover:bg-accent-soft/40">
              <span className="font-bold">{batch.batchCode}</span>
              <span>
                {material.type} {material.grade}
              </span>
              <span className="text-muted">{batch.supplier.name}</span>
              <span>{toNumber(batch.remainingKg).toLocaleString("en-IN")} kg</span>
              <span className="text-muted">{batch.importDate.toLocaleDateString("en-IN")}</span>
              <div>
                <details>
                  <summary className="district-subtle-button inline-flex cursor-pointer list-none">Edit</summary>
                  <form action={updateImportBatch} className="district-editor grid w-72 gap-2">
                    <input type="hidden" name="id" value={batch.id} />
                    <input className="district-field" name="batchCode" defaultValue={batch.batchCode} required />
                    <select className="district-field" name="supplierId" defaultValue={batch.supplierId} required>
                      {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                    </select>
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
                  <form action={deleteImportBatch} className="mt-2">
                    <input type="hidden" name="id" value={batch.id} />
                    <ConfirmSubmitButton message={`Delete batch ${batch.batchCode}?`}>Delete</ConfirmSubmitButton>
                  </form>
                ) : <p className="mt-2 text-xs font-semibold text-muted">Deletion locked: batch was used or adjusted.</p>}
              </div>
            </div>
          ))
        )}
      </section>
    </AppShell>
  );
}
