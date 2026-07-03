"use client";

import { cn } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/team-logo";
import { BET_TYPES } from "@/lib/constants";
import { Search, Plus } from "lucide-react";
import type { ExistingSubject, TeamMappingLite } from "./bet-form";

const STATUS_DOT: Record<string, string> = {
  en_cours: "bg-info",
  gagnee: "bg-primary",
  abandonnee: "bg-destructive",
};

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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-secondary-foreground">Nom</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onFocus={onFocus}
          placeholder="PSG, Mbappé, Djokovic..."
          className="w-full h-12 rounded-xl bg-card border border-border pl-9 pr-14 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        {apiSelected && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">
            API
          </span>
        )}
      </div>

      {showList &&
        name &&
        (subjectResults.length > 0 || mappingResults.length > 0 || showAddTeam) && (
          <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-card divide-y divide-border/50">
            {subjectResults.map((s) => (
              <button
                key={`${s.subject}::${s.betType}`}
                type="button"
                onClick={() => onPickSubject(s)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50"
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full flex-shrink-0",
                    STATUS_DOT[s.lastStatus] ?? "bg-muted"
                  )}
                />
                {s.logoUrl && <TeamLogo logoUrl={s.logoUrl} size="sm" />}
                <span className="text-sm text-foreground truncate">{s.subject}</span>
                <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                  {BET_TYPES[s.betType as keyof typeof BET_TYPES] ?? s.betType}
                </span>
              </button>
            ))}
            {mappingResults.map((m) => (
              <button
                key={`map::${m.subject}`}
                type="button"
                onClick={() => onPickMapping(m)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50"
              >
                {m.logoUrl && <TeamLogo logoUrl={m.logoUrl} size="sm" />}
                <span className="text-sm text-foreground truncate">{m.subject}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">équipe</span>
              </button>
            ))}
            {showAddTeam && (
              <button
                type="button"
                onClick={onAddTeam}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">
                  Créer l&apos;équipe «&nbsp;{name.trim()}&nbsp;»
                </span>
              </button>
            )}
          </div>
        )}
    </div>
  );
}
