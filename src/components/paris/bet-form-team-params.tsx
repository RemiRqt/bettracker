"use client";

import { Check, Link2 } from "lucide-react";
import { BET_TYPES, SPORTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Puces } from "@/components/kit/Puces";
import type { TeamSelection } from "./use-team-selection";

const BET_TYPE_ENTRIES = Object.entries(BET_TYPES) as [string, string][];
const SPORT_ENTRIES = Object.entries(SPORTS) as [string, string][];

const libelleDe = (entries: [string, string][], key: string) => entries.find(([k]) => k === key)?.[1];
const cleDe = (entries: [string, string][], label: string) => entries.find(([, l]) => l === label)?.[0];

interface ModeSelectorProps {
  modeChoice: "serie" | "unique";
  hasActiveSeries: boolean;
  onChoose: (m: "serie" | "unique") => void;
}

// Mode : Série (continuer / nouvelle) ou Pari unique. Bascule segmentée (2 colonnes).
export function BetModeSelector({ modeChoice, hasActiveSeries, onChoose }: ModeSelectorProps) {
  const options = [
    { key: "serie" as const, label: hasActiveSeries ? "Continuer la série" : "Nouvelle série" },
    { key: "unique" as const, label: "Pari unique" },
  ];
  return (
    <div role="group" aria-label="Mode de pari" className="grid grid-cols-2 gap-2">
      {options.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          aria-pressed={modeChoice === key}
          onClick={() => onChoose(key)}
          className={cn(
            "h-11 rounded-xl border text-sm font-medium transition-colors",
            modeChoice === key
              ? "bg-primary/15 border-primary/40 text-primary"
              : "bg-card border-border text-muted-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// Nouvelle équipe : type de pari + sport (+ lien API si foot).
export function BetTeamParams({ team }: { team: TeamSelection }) {
  const { betType, sport, apiTeam } = team;
  const typeLabel = libelleDe(BET_TYPE_ENTRIES, betType);
  const sportLabel = libelleDe(SPORT_ENTRIES, sport);
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-sm font-medium text-secondary-foreground">Type de pari</p>
        <Puces
          libelle="Type de pari"
          options={BET_TYPE_ENTRIES.map(([, l]) => l)}
          selection={typeLabel ? [typeLabel] : []}
          surChoix={(l) => {
            const k = cleDe(BET_TYPE_ENTRIES, l);
            if (k) team.setBetType(k);
          }}
        />
        {betType === "autre" && (
          <input
            value={team.betTypeCustom}
            onChange={(e) => team.setBetTypeCustom(e.target.value)}
            placeholder="Type personnalisé"
            aria-label="Type de pari personnalisé"
            className="w-full h-12 rounded-xl bg-card border border-border px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            autoFocus
          />
        )}
      </div>

      {apiTeam ? (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Check className="h-4 w-4" aria-hidden="true" /> Lié à {apiTeam.subject}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-medium text-secondary-foreground">Sport</p>
          <Puces
            libelle="Sport"
            options={SPORT_ENTRIES.map(([, l]) => l)}
            selection={sportLabel ? [sportLabel] : []}
            surChoix={(l) => {
              const k = cleDe(SPORT_ENTRIES, l);
              if (k) team.setSport(k);
            }}
          />
          {sport === "football" && (
            <button
              type="button"
              onClick={() => team.setAddTeamOpen(true)}
              className="flex min-h-11 items-center gap-1.5 text-sm text-primary hover:text-primary/80"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" /> Lier à une équipe API (logo & calendrier)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
