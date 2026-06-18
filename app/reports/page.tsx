import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export default function ReportsPage() {
  return (
    <AppShell>
      <PageHeader title="Reports" eyebrow="Analytics" />
      <section className="district-card overflow-hidden p-7 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="inline-flex rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent">Coming next</span>
            <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white">A clearer view of every decision.</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">Sales trends, margin movement, top materials and stock value will live here in one focused analytics workspace.</p>
          </div>
          <div className="grid h-64 grid-cols-6 items-end gap-3 rounded-[24px] bg-accent-soft/70 p-6">
            {[42, 68, 48, 82, 62, 94].map((height, index) => (
              <div key={index} className="rounded-t-xl bg-accent/80" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
