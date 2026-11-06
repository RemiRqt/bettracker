"use client";

import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Bet, FilterKey, FilterValue, SortKey } from "./paris-types";

// Filtres colorés (statut) et tri réversible : boutons maison gardés (couleur par statut,
// compteur, flèche de sens), avec aria-pressed comme les Puces du kit.

const FILTERS: { key: FilterValue; label: string; color: string; activeColor: string }[] = [
  { key: "en_cours", label: "En cours", color: "text-info border-info/30", activeColor: "bg-info/20" },
  { key: "gagne", label: "Gagné", color: "text-primary border-primary/30", activeColor: "bg-primary/20" },
  { key: "perdu", label: "Perdu", color: "text-destructive border-destructive/30", activeColor: "bg-destructive/20" },
];

const SORTS: { key: SortKey; label: string; srLabel: string }[] = [
  { key: "date", label: "Date", srLabel: "date" },
  { key: "gains", label: "Gains", srLabel: "gains" },
  { key: "mise", label: "Mise", srLabel: "mise" },
  { key: "cote", label: "Cote", srLabel: "cote" },
];

function matchFilter(b: Bet, filter: FilterValue) {
  switch (filter) {
    case "en_cours": return b.result === null;
    case "gagne": return b.result === "gagne";
    case "perdu": return b.result === "perdu";
  }
}

function compare(a: Bet, b: Bet, sortBy: SortKey) {
  switch (sortBy) {
    case "date": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    case "gains": return b.potential_net - a.potential_net;
    case "mise": return b.stake - a.stake;
    case "cote": return b.odds - a.odds;
  }
}

/** Filtre + tri de la liste ; les paris « en cours » restent toujours en haut. */
export function useParisTri(bets: Bet[], initialFilter: FilterKey) {
  const [filter, setFilter] = useState<FilterKey>(initialFilter);
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  }

  const counts = useMemo(() => ({
    en_cours: bets.filter((b) => matchFilter(b, "en_cours")).length,
    gagne: bets.filter((b) => matchFilter(b, "gagne")).length,
    perdu: bets.filter((b) => matchFilter(b, "perdu")).length,
  }), [bets]);

  const sorted = useMemo(() => {
    const arr = filter === null ? [...bets] : bets.filter((b) => matchFilter(b, filter));
    arr.sort((a, b) => {
      const aPending = a.result === null ? 0 : 1;
      const bPending = b.result === null ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      const cmp = compare(a, b, sortBy);
      return sortAsc ? -cmp : cmp;
    });
    return arr;
  }, [bets, filter, sortBy, sortAsc]);

  return { filter, setFilter, sortBy, sortAsc, handleSort, counts, sorted };
}

type Tri = ReturnType<typeof useParisTri>;

export function ParisFiltres({ tri }: { tri: Tri }) {
  const { filter, setFilter, counts } = tri;
  return (
    <div role="group" aria-label="Filtrer les paris" className="grid grid-cols-3 gap-1.5">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          aria-pressed={filter === f.key}
          onClick={() => setFilter(filter === f.key ? null : f.key)}
          className={cn(
            "relative py-2 before:absolute before:-inset-y-1.5 before:inset-x-0 rounded-xl text-xs font-semibold transition-colors border",
            filter === f.key
              ? `${f.activeColor} ${f.color}`
              : "bg-transparent text-muted-foreground border-border/50 hover:border-border"
          )}
        >
          {f.label}
          <span className="ml-1 opacity-60">{counts[f.key]}</span>
        </button>
      ))}
    </div>
  );
}

export function ParisTri({ tri }: { tri: Tri }) {
  const { sortBy, sortAsc, handleSort } = tri;
  return (
    <div role="group" aria-label="Trier les paris" className="grid grid-cols-4 gap-1">
      {SORTS.map((s) => {
        const isActive = sortBy === s.key;
        return (
          <button
            key={s.key}
            type="button"
            aria-pressed={isActive}
            aria-label={
              isActive
                ? `Trier par ${s.srLabel}, ${sortAsc ? "croissant" : "décroissant"}`
                : `Trier par ${s.srLabel}`
            }
            onClick={() => handleSort(s.key)}
            className={cn(
              "relative before:absolute before:-top-1.5 before:-bottom-2.5 before:inset-x-0 flex items-center justify-center gap-0.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors border",
              isActive
                ? "bg-primary/20 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border hover:border-border/80"
            )}
          >
            {s.label}
            {isActive && (
              sortAsc
                ? <ChevronUp className="h-3 w-3" aria-hidden="true" />
                : <ChevronDown className="h-3 w-3" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
