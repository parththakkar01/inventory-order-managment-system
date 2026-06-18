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
  const toneClass = tone === "accent"
    ? "border-accent/30 bg-[#6d4fd1] text-white"
    : tone === "warning"
      ? "border-amber-300/20 bg-[#2b2417] text-amber-50"
      : "border-white/[0.07] bg-panel text-white";
  const labelClass = tone === "accent" ? "text-white/70" : tone === "warning" ? "text-amber-200/70" : "text-muted";

  return (
    <section className={`rounded-[28px] border p-6 shadow-card ${toneClass}`}>
      <p className={`text-sm font-semibold ${labelClass}`}>{label}</p>
      <div className="mt-5 text-3xl font-black tracking-[-0.04em]">{value}</div>
      {detail ? <p className={`mt-2 text-sm ${labelClass}`}>{detail}</p> : null}
    </section>
  );
}
