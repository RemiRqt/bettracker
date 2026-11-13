"use client";

import { Search, ChevronDown, ChevronUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusAuMontage } from "@/hooks/use-focus-au-montage";

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
  const focusRecherche = useFocusAuMontage();
  return (
    <>
      {props.searchOpen && (
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            aria-label="Rechercher une équipe"
            placeholder="Rechercher..."
            value={props.search}
            onChange={(e) => props.onSearch(e.target.value)}
            ref={focusRecherche}
            className="h-10 w-full rounded-xl border border-border bg-card pr-4 pl-10 text-sm text-secondary-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
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
      <div role="group" aria-label="Filtrer les équipes" className="scrollbar-none -my-2.5 flex flex-1 gap-1.5 overflow-x-auto pt-2.5 pb-3.5">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filterBy === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilter(isActive ? null : opt.key)}
              className={cn(
                "relative flex-shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors before:absolute before:inset-x-0 before:-inset-y-2.5",
                isActive ? `${opt.activeColor} ${opt.color}` : "border-border/50 bg-transparent text-muted-foreground hover:border-border",
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
        className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:border-primary/50"
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
              "relative flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium transition-colors before:absolute before:inset-x-0 before:-inset-y-2",
              isActive ? "border-primary/30 bg-primary/20 text-primary" : "border-border bg-card text-muted-foreground hover:border-border/80",
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
          "relative flex w-11 flex-shrink-0 items-center justify-center rounded-lg border transition-colors before:absolute before:inset-x-0 before:-inset-y-2",
          searchOpen ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-secondary-foreground hover:text-foreground",
        )}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
