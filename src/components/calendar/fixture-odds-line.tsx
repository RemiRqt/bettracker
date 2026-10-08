import { bookmakerLabel } from "@/lib/odds-api";
import type { OutcomeBest } from "@/lib/odds-matching";

interface FixtureOddsLineProps {
  odds: { home: OutcomeBest | null; draw: OutcomeBest | null; away: OutcomeBest | null };
  homeLabel: string;
  awayLabel: string;
}

function Cell({ label, best }: { label: string; best: OutcomeBest | null }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center rounded-lg bg-background px-1.5 py-1">
      <span className="max-w-full truncate text-[10px] text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{best ? best.price.toFixed(2) : "—"}</span>
      <span className="max-w-full truncate text-[10px] text-muted-foreground">
        {best ? bookmakerLabel(best.bookmaker) : ""}
      </span>
    </div>
  );
}

/** Meilleure cote 1 / N / 2 (bookmakers du user) sous un match du calendrier. */
export function FixtureOddsLine({ odds, homeLabel, awayLabel }: FixtureOddsLineProps) {
  return (
    <div className="flex gap-1.5">
      <Cell label={homeLabel} best={odds.home} />
      <Cell label="N" best={odds.draw} />
      <Cell label={awayLabel} best={odds.away} />
    </div>
  );
}
