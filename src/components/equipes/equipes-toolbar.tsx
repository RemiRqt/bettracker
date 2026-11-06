"use client";

import { Search, ChevronDown, ChevronUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortKey = "date" | "gains" | "paris";
export type FilterKey = "en_cours" | "gagne" | "perdu" | null;

const SORT_OPTIONS: { key: SortKey; label: string; srLabel: string }[] = [
  { key: "date", label: "Récent", srLabel: "date" },
  { key: "gains", label: "Gains", srLabel: "gains" },
  { key: "paris", label: "Paris", srLabel: "nombre de paris" },
];

const FILTER_OPTIONS: {
  key: "en_cours" | "gagne" | "perdu";
  label: string;
  color: string;
  activeColor: string;
}[] = [
  { key: "en_cours", label: "En cours", color: "text-info border-info/30", activeColor: "bg-info/20" },
  { key: "gagne", label: "Gagné", color: "text-primary border-primary/30", activeColor: "bg-primary/20" },
  { key: "perdu", label: "Perdu", color: "text-destructive border-destructive/30", activeColor: "bg-destructive/20" },
];

interface EquipesToolbarProps {
  search: string;
  onSearch: (v: string) => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
  filterBy: FilterKey;
  onFilter: (f: FilterKey) => void;
  counts: Record<"en_cours" | "gagne" | "perdu", number>;
  sortBy: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
  onOpenMyTeams: () => void;
}

// Barre d'outils de la page Équipes : recherche (repliable), filtres, « Mes équipes », tri.
export function EquipesToolbar(props: EquipesToolbarProps) {
  return (
    <>
      {props.searchOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            aria-label="Rechercher une équipe"
            placeholder="Rechercher..."
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            autoFocus
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm text-secondary-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
      )}
      <FilterBar {...props} />
      <SortBar {...props} />
    </>
  );
}

function FilterBar({ filterBy, onFilter, counts, onOpenMyTeams }: EquipesToolbarProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        role="group"
        aria-label="Filtrer les équipes"
        className="flex gap-1.5 overflow-x-auto -my-2.5 pt-2.5 pb-3.5 scrollbar-none flex-1"
      >
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filterBy === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilter(isActive ? null : opt.key)}
              className={cn(
                "relative flex-shrink-0 px-2.5 py-1 before:absolute before:-inset-y-2.5 before:inset-x-0 rounded-lg text-xs font-medium transition-colors border",
                isActive
                  ? `${opt.activeColor} ${opt.color}`
                  : "bg-transparent text-muted-foreground border-border/50 hover:border-border"
              )}
            >
              {opt.label}
              <span className="ml-1 opacity-60">{counts[opt.key]}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onOpenMyTeams}
        className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:border-primary/50 transition-colors"
      >
        <Users className="h-3.5 w-3.5" aria-hidden="true" /> Mes équipes
      </button>
    </div>
  );
}

function SortBar({ sortBy, sortAsc, onSort, searchOpen, onToggleSearch }: EquipesToolbarProps) {
  return (
    <div role="group" aria-label="Trier les équipes" className="flex items-stretch gap-1.5">
      {SORT_OPTIONS.map((opt) => {
        const isActive = sortBy === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={isActive}
            aria-label={`Trier par ${opt.srLabel}${isActive ? (sortAsc ? ", croissant" : ", décroissant") : ""}`}
            onClick={() => onSort(opt.key)}
            className={cn(
              "relative flex-1 before:absolute before:-inset-y-2 before:inset-x-0 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              isActive
                ? "bg-primary/20 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border hover:border-border/80"
            )}
          >
            {opt.label}
            {isActive && (sortAsc ? <ChevronUp className="h-3 w-3" aria-hidden="true" /> : <ChevronDown className="h-3 w-3" aria-hidden="true" />)}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onToggleSearch}
        aria-label="Rechercher une équipe"
        aria-expanded={searchOpen}
        className={cn(
          "relative flex-shrink-0 w-11 before:absolute before:-inset-y-2 before:inset-x-0 flex items-center justify-center rounded-lg border transition-colors",
          searchOpen
            ? "bg-primary/10 border-primary/40 text-primary"
            : "bg-card border-border text-secondary-foreground hover:text-foreground"
        )}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
