import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  detail,
  tone = "default"
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: "default" | "accent" | "warning";
}) {
  const toneClass =
    tone === "accent" ? "border-accent/50" : tone === "warning" ? "border-amber-400/50" : "border-white/10";

  return (
    <section className={`rounded-2xl border ${toneClass} bg-panel p-5 shadow-card`}>
      <p className="text-sm font-medium text-muted">{label}</p>
      <div className="mt-3 text-3xl font-black tracking-normal">{value}</div>
      {detail ? <p className="mt-2 text-sm text-muted">{detail}</p> : null}
    </section>
  );
}
