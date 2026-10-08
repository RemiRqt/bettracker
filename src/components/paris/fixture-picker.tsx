"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickedFixture {
  id: number;
  kickoff: string;
  homeTeamId: number;
  awayTeamId: number;
  /** [nom complet, nom court] de chaque équipe (rapprochement des cotes). */
  homeNames: string[];
  awayNames: string[];
  competitionCode: string | null;
}

interface ApiFixture {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  competitionCode: string | null;
}

function toPicked(f: ApiFixture): PickedFixture {
  return {
    id: f.id,
    kickoff: f.date,
    homeTeamId: f.homeTeamId,
    awayTeamId: f.awayTeamId,
    homeNames: [f.homeTeamName, f.homeTeam].filter(Boolean),
    awayNames: [f.awayTeamName, f.awayTeam].filter(Boolean),
    competitionCode: f.competitionCode ?? null,
  };
}

interface FixturePickerProps {
  teamId: number;
  value: PickedFixture | null;
  onChange: (f: PickedFixture | null) => void;
}

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const CHIP = "w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors";

/**
 * Choix du match sur lequel porte le pari (prochain match pré-sélectionné).
 * Sert à la suggestion automatique du résultat. Monté avec `key={teamId}`.
 */
export function FixturePicker({ teamId, value, onChange }: FixturePickerProps) {
  const [fixtures, setFixtures] = useState<ApiFixture[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/football/fixtures?teamId=${teamId}&limit=5`)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
      .then((list: ApiFixture[]) => {
        if (cancelled) return;
        const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
        setFixtures(sorted);
        onChange(sorted[0] ? toPicked(sorted[0]) : null);
      });
    return () => {
      cancelled = true;
    };
    // onChange volontairement hors deps : pré-sélection une seule fois par équipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-secondary-foreground">Match</label>
      {fixtures === null ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement des matchs…
        </div>
      ) : (
        <div className="space-y-1.5">
          {fixtures.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(toPicked(f))}
              className={cn(
                CHIP,
                value?.id === f.id
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-card border-border text-muted-foreground",
              )}
            >
              <span className="capitalize">{DATE_FMT.format(new Date(f.date))}</span>
              {" · "}
              {f.homeTeam} – {f.awayTeam}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn(
              CHIP,
              value === null
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-card border-border text-muted-foreground",
            )}
          >
            Aucun match (résultat à saisir moi-même)
          </button>
        </div>
      )}
    </div>
  );
}
