import type { ReactNode } from "react";

export function PageHeader({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent">{eyebrow}</p> : null}
        <h1 className="mt-2 text-4xl font-black tracking-normal sm:text-5xl">{title}</h1>
      </div>
      {action}
    </header>
  );
}
