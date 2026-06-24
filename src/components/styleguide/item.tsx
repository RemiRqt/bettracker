import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Wrapper de catalogue. Chaque élément de la charte est encapsulé dans un <Item>
 * avec un numéro stable et visible (#NN) pour pouvoir le cibler en feedback
 * ("modifie 42, augmente la police"). Les numéros sont alloués par tranches dans
 * chaque section, avec des trous pour insérer sans tout renuméroter.
 */
export function Item({
  id,
  label,
  hint,
  children,
  className,
}: {
  id: number;
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      id={`el-${id}`}
      className="scroll-mt-32 rounded-lg border border-slate-700/60 bg-slate-900/40 p-4"
    >
      <div className="mb-3 flex items-baseline gap-2">
        <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-md bg-emerald-500/15 px-1.5 font-mono text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
          {id}
        </span>
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </div>
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        {children}
      </div>
    </div>
  );
}

/** Bloc de section avec ancre + titre numéroté. */
export function Section({
  anchor,
  n,
  title,
  description,
  children,
}: {
  anchor: string;
  n: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={anchor} className="scroll-mt-28">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-white">
          <span className="text-slate-500">{n}.</span> {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-slate-400">{description}</p>
        )}
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}
