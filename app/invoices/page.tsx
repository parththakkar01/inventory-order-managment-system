import { AppShell } from "@/components/app-shell";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader } from "@/components/page-header";
import { deleteInvoice, updateInvoice } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: { sale: { include: { buyer: true } } },
    orderBy: { issuedAt: "desc" }
  });

  return (
    <AppShell>
      <PageHeader title="Invoices" eyebrow="Generated documents" />
      <section className="grid gap-4 lg:grid-cols-2">
        {invoices.map((invoice) => (
          <article key={invoice.id} className="district-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-accent">Invoice #{invoice.invoiceNumber}</p>
                <h2 className="mt-2 text-2xl font-black">{invoice.sale.buyer.name}</h2>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zM9 8h6M9 12h6" />
                </svg>
              </span>
            </div>
            <p className="mt-3 text-3xl font-black">Rs {toNumber(invoice.sale.totalAmount).toLocaleString("en-IN")}</p>
            <p className="mt-2 text-sm text-muted">Issued {invoice.issuedAt.toLocaleDateString("en-IN")}</p>
            <p className="mt-1 text-sm text-muted">{invoice.companyName} / {invoice.companyGstin}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <details>
                <summary className="district-subtle-button inline-flex cursor-pointer list-none">Edit invoice</summary>
                <form action={updateInvoice} className="district-editor grid gap-3">
                  <input type="hidden" name="id" value={invoice.id} />
                  <input className="district-field" name="companyName" defaultValue={invoice.companyName} required />
                  <input className="district-field" name="companyGstin" defaultValue={invoice.companyGstin} required />
                  <input className="district-field" name="issuedAt" type="date" defaultValue={invoice.issuedAt.toISOString().slice(0, 10)} required />
                  <button className="district-button">Save invoice</button>
                </form>
              </details>
              <form action={deleteInvoice}>
                <input type="hidden" name="id" value={invoice.id} />
                <ConfirmSubmitButton message={`Delete invoice #${invoice.invoiceNumber}? The sale will remain.`}>Delete invoice</ConfirmSubmitButton>
              </form>
            </div>
          </article>
        ))}
        {invoices.length === 0 ? <div className="rounded-[28px] border border-dashed border-white/10 bg-panel p-8 text-muted">No invoices generated yet.</div> : null}
      </section>
    </AppShell>
  );
}
