"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { THEMES, THEME_COOKIE, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Applique le thème tout de suite (attribut de <html>) et le retient pour le rendu serveur (cookie). */
function appliquerTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
}

export function ThemeSelector({ current }: { current: Theme }) {
  const [theme, setTheme] = useState<Theme>(current);

  function apply(next: Theme) {
    setTheme(next);
    appliquerTheme(next);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => apply(t.id)}
          aria-pressed={theme === t.id}
          className={cn(
            "relative flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
            theme === t.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted",
          )}
        >
          {theme === t.id && <Check className="absolute top-3 right-3 h-4 w-4 text-primary" />}
          <span className="text-sm font-semibold text-foreground">{t.label}</span>
          <span className="text-xs text-muted-foreground">{t.hint}</span>
        </button>
      ))}
    </div>
  );
}
