"use client";

import { useState, useTransition } from "react";
import { saveBookmakers } from "@/actions/notifications";
import { BOOKMAKERS } from "@/lib/odds-api";
import { cn } from "@/lib/utils";

/** Bookmakers dont l'utilisateur voit les cotes à la création d'un pari. */
export function BookmakerSettings({ initial }: { initial: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggle(key: string) {
    const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
    if (next.length === 0) {
      setError("Garde au moins un bookmaker.");
      return;
    }
    setError("");
    const prev = selected;
    setSelected(next);
    startTransition(async () => {
      const res = await saveBookmakers(next);
      if (res.error) {
        setError(res.error);
        setSelected(prev);
      }
    });
  }

  return (
    <div className="rounded-xl bg-card p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Mes bookmakers</h2>
        <p className="text-xs text-muted-foreground">Cotes du marché affichées quand tu crées un pari</p>
      </div>
      <div className="space-y-2">
        {BOOKMAKERS.map((b) => {
          const on = selected.includes(b.key);
          return (
            <button
              key={b.key}
              type="button"
              role="switch"
              aria-checked={on}
              disabled={isPending}
              onClick={() => toggle(b.key)}
              className="flex w-full items-center justify-between gap-3 text-left disabled:opacity-50"
            >
              <span className="text-sm text-foreground">
                {b.label}
                {b.note && <span className="ml-1.5 text-xs text-muted-foreground">({b.note})</span>}
              </span>
              <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-primary" : "bg-muted")}>
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform",
                    on ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
