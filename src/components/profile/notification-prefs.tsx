"use client";

import { useState, useTransition } from "react";
import { saveNotificationSettings, saveResultNotifications } from "@/actions/notifications";
import { cn } from "@/lib/utils";

interface Props {
  initialMatches: boolean;
  initialResults: boolean;
}

function PrefSwitch({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block text-sm text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

/** Préférences fines, affichées quand l'appareil est abonné aux push. */
export function NotificationPrefs({ initialMatches, initialResults }: Props) {
  const [matches, setMatches] = useState(initialMatches);
  const [results, setResults] = useState(initialResults);
  const [isPending, startTransition] = useTransition();

  function toggle(v: boolean, set: (v: boolean) => void, save: (v: boolean) => Promise<{ error?: string }>) {
    set(v);
    startTransition(async () => {
      const res = await save(v);
      if (res.error) set(!v);
    });
  }

  return (
    <div className="space-y-3 border-t border-border/50 pt-3">
      <PrefSwitch
        label="Matchs du jour"
        hint="Résumé quotidien des matchs de tes équipes"
        checked={matches}
        disabled={isPending}
        onChange={(v) => toggle(v, setMatches, saveNotificationSettings)}
      />
      <PrefSwitch
        label="Résultats de paris"
        hint="Score final + résultat proposé ~2h après le coup d'envoi"
        checked={results}
        disabled={isPending}
        onChange={(v) => toggle(v, setResults, saveResultNotifications)}
      />
    </div>
  );
}
