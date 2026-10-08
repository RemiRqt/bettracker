"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { runResultCheckNow } from "@/actions/resolution";
import type { ResolveReport } from "@/lib/resolve-bets-job";

const LABELS: [keyof ResolveReport, string][] = [
  ["checked", "examinés"],
  ["linked", "rattachés à un match"],
  ["suggested", "résultats proposés"],
  ["postponed", "reportés"],
  ["expired", "introuvables"],
  ["manual", "à saisir à la main"],
  ["skipped", "en attente"],
  ["notified", "notifs envoyées"],
];

/** Admin only : lance la suggestion de résultat sans attendre les 2h. */
export function ResultCheckButton() {
  const [report, setReport] = useState<ResolveReport | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function run() {
    setError("");
    startTransition(async () => {
      const res = await runResultCheckNow();
      if (res.error) setError(res.error);
      else setReport(res.report ?? null);
    });
  }

  return (
    <div className="rounded-xl bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Résultats auto (admin)</h2>
          <p className="text-xs text-muted-foreground">Vérifie tes paris en attente sans attendre 2h</p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={isPending}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Vérifier maintenant
        </button>
      </div>
      {report && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-secondary-foreground">
          {LABELS.map(([key, label]) => (
            <li key={key}>
              <span className="font-semibold text-foreground">{report[key] as number}</span> {label}
            </li>
          ))}
        </ul>
      )}
      {report && report.errors.length > 0 && (
        <p className="text-xs text-destructive">{report.errors.join(" · ")}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
