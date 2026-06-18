import { AppShell } from "@/components/app-shell";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/10 ${className}`} />;
}

export function PageSkeleton({ variant = "dashboard" }: { variant?: "dashboard" | "inventory" | "sales" | "invoices" | "reports" }) {
  const metricCount = variant === "dashboard" ? 4 : variant === "invoices" ? 2 : 3;

  return (
    <AppShell>
      <header className="mb-7">
        <SkeletonBlock className="h-3 w-36 rounded-full" />
        <SkeletonBlock className="mt-4 h-12 w-72" />
      </header>

      {variant === "inventory" || variant === "sales" ? (
        <section className="mb-8 grid gap-4 xl:grid-cols-2">
          <SkeletonBlock className="h-80" />
          <SkeletonBlock className="h-80" />
        </section>
      ) : null}

      <section className={`grid gap-4 ${variant === "dashboard" ? "md:grid-cols-4" : "lg:grid-cols-3"}`}>
        {Array.from({ length: metricCount }).map((_, index) => (
          <SkeletonBlock key={index} className="h-36" />
        ))}
      </section>

      <section className="mt-8 space-y-4">
        <SkeletonBlock className="h-8 w-48" />
        {Array.from({ length: variant === "dashboard" ? 3 : 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24" />
        ))}
      </section>
    </AppShell>
  );
}
