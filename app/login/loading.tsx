function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className}`} />;
}

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-7 shadow-card">
        <SkeletonBlock className="h-3 w-32 rounded-full" />
        <SkeletonBlock className="mt-4 h-11 w-40" />
        <div className="mt-8 space-y-4">
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
        </div>
        <SkeletonBlock className="mt-6 h-12" />
      </section>
    </main>
  );
}
