import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export default function ReportsPage() {
  return (
    <AppShell>
      <PageHeader title="Reports" eyebrow="Analytics" />
      <section className="rounded-2xl border border-dashed border-white/15 p-8 text-muted">
        Charts for sales trends, profit over time, top-selling materials, and stock value come next.
      </section>
    </AppShell>
  );
}
