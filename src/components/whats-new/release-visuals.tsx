import { Bell, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReleaseVisual } from "@/lib/releases";

/** Maquettes miniatures des écrans de l'app, affichées dans la popup des nouveautés. */

function OddsVisual() {
  return (
    <div className="w-full space-y-2">
      <div className="flex gap-1.5">
        {[
          { label: "PSG", price: "1.05", bk: "Winamax", best: true },
          { label: "N", price: "12.00", bk: "Unibet" },
          { label: "Le Mans", price: "23.00", bk: "Betclic" },
        ].map((c) => (
          <div
            key={c.label}
            className={cn(
              "flex flex-1 flex-col items-center rounded-lg bg-background py-1.5",
              c.best && "ring-1 ring-primary",
            )}
          >
            <span className="text-[10px] text-muted-foreground">{c.label}</span>
            <span className="text-base font-bold text-foreground">{c.price}</span>
            <span className="text-[10px] text-muted-foreground">{c.bk}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5">
        <span className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
          <Star className="h-3 w-3 fill-current" /> Winamax <b>2.15</b>
        </span>
        <span className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-secondary-foreground">
          Betclic <b>2.10</b>
        </span>
      </div>
    </div>
  );
}

function ResultVisual() {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 rounded-xl bg-background/80 p-2 shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-black text-primary-foreground">
          BT
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs font-semibold text-foreground">PSG 2-1</p>
          <p className="truncate text-[11px] text-muted-foreground">Pari n°3 gagné ? Confirme en un tap</p>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-2">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> 2-1 · Gagné ?
        </span>
        <span className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Confirmer</span>
      </div>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={cn("relative h-5 w-9 shrink-0 rounded-full", on ? "bg-primary" : "bg-muted")}>
      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-background", on ? "left-[18px]" : "left-0.5")} />
    </span>
  );
}

function SettingsVisual() {
  return (
    <div className="w-full space-y-1.5">
      {[
        { label: "Winamax", on: true },
        { label: "Betclic", on: true },
        { label: "Unibet", on: false },
      ].map((b) => (
        <div key={b.label} className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5">
          <span className="text-sm text-foreground">{b.label}</span>
          <Toggle on={b.on} />
        </div>
      ))}
      <div className="flex items-center justify-between rounded-lg bg-background px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-sm text-foreground">
          <Bell className="h-3.5 w-3.5 text-primary" /> Résultats de paris
        </span>
        <Toggle on />
      </div>
    </div>
  );
}

const VISUALS: Record<ReleaseVisual, () => React.ReactElement> = {
  odds: OddsVisual,
  result: ResultVisual,
  settings: SettingsVisual,
};

export function ReleaseVisualView({ visual }: { visual: ReleaseVisual }) {
  const V = VISUALS[visual];
  return <V />;
}

