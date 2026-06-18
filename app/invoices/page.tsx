import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
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
          <article key={invoice.id} className="rounded-2xl border border-white/10 bg-panel p-5 shadow-card">
            <p className="text-sm text-muted">Invoice #{invoice.invoiceNumber}</p>
            <h2 className="mt-2 text-2xl font-black">{invoice.sale.buyer.name}</h2>
            <p className="mt-3 text-3xl font-black">Rs {toNumber(invoice.sale.totalAmount).toLocaleString("en-IN")}</p>
            <p className="mt-2 text-sm text-muted">Issued {invoice.issuedAt.toLocaleDateString("en-IN")}</p>
          </article>
        ))}
        {invoices.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-8 text-muted">No invoices generated yet.</div> : null}
      </section>
    </AppShell>
  );
}
