function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/[0.07] ${className}`} />;
}

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#08080a] p-4 sm:p-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[36px] bg-[#121216] shadow-float lg:grid-cols-2">
        <SkeletonBlock className="hidden min-h-[680px] rounded-none bg-[#1d1b20] lg:block" />
        <div className="flex min-h-[620px] flex-col justify-center p-7 sm:p-14">
          <SkeletonBlock className="h-4 w-28 rounded-full" />
          <SkeletonBlock className="mt-5 h-14 w-72" />
          <SkeletonBlock className="mt-4 h-5 w-56" />
          <div className="mt-9 space-y-5">
            <SkeletonBlock className="h-20" />
            <SkeletonBlock className="h-20" />
          </div>
          <SkeletonBlock className="mt-6 h-14" />
        </div>
      </section>
    </main>
  );
}
