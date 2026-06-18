import type { ReactNode } from "react";

export function PageHeader({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="inline-flex rounded-full bg-accent-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">{title}</h1>
      </div>
      {action}
    </header>
  );
}
