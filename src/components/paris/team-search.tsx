"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/team-logo";
import { BET_TYPES } from "@/lib/constants";
import { Search, Plus } from "lucide-react";
import type { ExistingSubject, TeamMappingLite } from "./bet-form-types";

const STATUS_DOT: Record<string, string> = {
  en_cours: "bg-info",
  gagnee: "bg-primary",
  abandonnee: "bg-destructive",
};
const STATUS_LABEL: Record<string, string> = {
  en_cours: "série en cours",
  gagnee: "dernière série gagnée",
  abandonnee: "dernière série abandonnée",
};

const OPTION = "w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer hover:bg-muted/50";

interface TeamSearchProps {
  name: string;
  onNameChange: (v: string) => void;
  apiSelected: boolean;
  showList: boolean;
  onFocus: () => void;
  subjectResults: ExistingSubject[];
  mappingResults: TeamMappingLite[];
  showAddTeam: boolean;
  onPickSubject: (s: ExistingSubject) => void;
  onPickMapping: (m: TeamMappingLite) => void;
  onAddTeam: () => void;
}

export function TeamSearch({
  name,
  onNameChange,
  apiSelected,
  showList,
  onFocus,
  subjectResults,
  mappingResults,
  showAddTeam,
  onPickSubject,
  onPickMapping,
  onAddTeam,
}: TeamSearchProps) {
  const inputId = useId();
  const listId = useId();
  // Combobox ARIA : flèches haut/bas pour parcourir, Entrée pour choisir.
  const choix: (() => void)[] = [
    ...subjectResults.map((r) => () => onPickSubject(r)),
    ...mappingResults.map((m) => () => onPickMapping(m)),
    ...(showAddTeam ? [onAddTeam] : []),
  ];
  const ouvert = showList && !!name && choix.length > 0;
  const [actif, setActif] = useState(-1);
  const actifSur = ouvert && actif >= 0 && actif < choix.length ? actif : -1;
  const optId = (i: number) => `${listId}-opt-${i}`;
  const optionProps = (i: number, choisir: () => void) => ({
    id: optId(i),
    role: "option" as const,
    "aria-selected": actifSur === i,
    onClick: choisir,
  });

  function surTouche(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!ouvert) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const pas = e.key === "ArrowDown" ? 1 : -1;
      setActif((i) => (Math.max(i, -1) + pas + choix.length) % choix.length);
    } else if (e.key === "Enter" && actifSur >= 0) {
      e.preventDefault();
      choix[actifSur]();
      setActif(-1);
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-secondary-foreground">Nom</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <input
          id={inputId}
          autoComplete="off"
          value={name}
          onChange={(e) => {
            setActif(-1);
            onNameChange(e.target.value);
          }}
          onFocus={onFocus}
          onKeyDown={surTouche}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={ouvert}
          aria-controls={listId}
          aria-activedescendant={actifSur >= 0 ? optId(actifSur) : undefined}
          placeholder="PSG, Mbappé, Djokovic..."
          className="w-full h-12 rounded-xl bg-card border border-border pl-9 pr-14 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        {apiSelected && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs px-1.5 py-0.5 rounded bg-primary/15 text-primary"
            title="Équipe liée à l'API"
          >
            API
          </span>
        )}
      </div>

      {ouvert && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="max-h-56 overflow-y-auto rounded-lg border border-border bg-card divide-y divide-border/50"
        >
          {subjectResults.map((r, i) => (
            <li key={`${r.subject}::${r.betType}`} {...optionProps(i, () => onPickSubject(r))} className={cn(OPTION, actifSur === i && "bg-muted/50")}>
              <span aria-hidden="true" className={cn("h-2 w-2 rounded-full flex-shrink-0", STATUS_DOT[r.lastStatus] ?? "bg-muted")} />
              {r.logoUrl && <TeamLogo logoUrl={r.logoUrl} size="sm" />}
              <span className="text-sm text-foreground truncate">{r.subject}</span>
              {STATUS_LABEL[r.lastStatus] && <span className="sr-only">, {STATUS_LABEL[r.lastStatus]}</span>}
              <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 rounded text-2xs bg-muted text-muted-foreground">
                {BET_TYPES[r.betType as keyof typeof BET_TYPES] ?? r.betType}
              </span>
            </li>
          ))}
          {mappingResults.map((m, j) => {
            const i = subjectResults.length + j;
            return (
              <li key={`map::${m.subject}`} {...optionProps(i, () => onPickMapping(m))} className={cn(OPTION, actifSur === i && "bg-muted/50")}>
                {m.logoUrl && <TeamLogo logoUrl={m.logoUrl} size="sm" />}
                <span className="text-sm text-foreground truncate">{m.subject}</span>
                <span className="ml-auto text-2xs text-muted-foreground">équipe</span>
              </li>
            );
          })}
          {showAddTeam && (
            <li
              {...optionProps(choix.length - 1, onAddTeam)}
              className={cn(OPTION, "gap-2 text-primary hover:bg-primary/5", actifSur === choix.length - 1 && "bg-primary/5")}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm">Créer l&apos;équipe «&nbsp;{name.trim()}&nbsp;»</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
