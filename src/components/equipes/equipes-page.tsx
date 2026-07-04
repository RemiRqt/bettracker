"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { deleteEquipe, updateEquipeSport } from "@/actions/equipes";
import { validateResult } from "@/actions/bets";
import { fireConfetti } from "@/lib/confetti";
import { useBetModal } from "@/components/paris/bet-modal-provider";
import { FollowedTeams } from "@/components/profile/followed-teams";
import { EquipeCard, type MergedEquipe } from "./equipe-card";
import type { TeamMapping } from "@/actions/teams";
import { SPORTS, SPORT_EMOJIS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Inbox,
  Users,
} from "lucide-react";

type SortKey = "date" | "gains" | "paris";
type FilterKey = "en_cours" | "gagne" | "perdu" | null;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Récent" },
  { key: "gains", label: "Gains" },
  { key: "paris", label: "Paris" },
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

interface EquipesPageProps {
  equipes: MergedEquipe[];
  logoMap: Record<string, string>;
  nextFixtureMap?: Record<string, { date: string }>;
  teamMappings?: TeamMapping[];
}

export function EquipesPage({ equipes, logoMap, nextFixtureMap = {}, teamMappings = [] }: EquipesPageProps) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Filters & sort
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterBy, setFilterBy] = useState<FilterKey>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [myTeamsOpen, setMyTeamsOpen] = useState(false);
  const [editEquipe, setEditEquipe] = useState<MergedEquipe | null>(null);
  const [seriesShowAll, setSeriesShowAll] = useState<Set<string>>(new Set());

  const { open: openBetModal } = useBetModal();

  // === Sort/Filter logic ===

  function handleSort(key: SortKey) {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  }

  const counts = useMemo(() => {
    const c = { en_cours: 0, gagne: 0, perdu: 0 };
    for (const eq of equipes) {
      if (eq.enCoursCount > 0) c.en_cours++;
      if (eq.netProfit > 0) c.gagne++;
      if (eq.netProfit < 0) c.perdu++;
    }
    return c;
  }, [equipes]);

  const filtered = equipes.filter((eq) => {
    if (!eq.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBy === null) return true;
    switch (filterBy) {
      case "en_cours": return eq.enCoursCount > 0;
      case "gagne": return eq.netProfit > 0;
      case "perdu": return eq.netProfit < 0;
    }
  });

  const sorted = [...filtered].sort((a, b) => {
    // séries en cours toujours en haut
    const aActive = a.activeSeries ? 0 : 1;
    const bActive = b.activeSeries ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;

    let cmp = 0;
    switch (sortBy) {
      case "date": cmp = b.lastBetDate.localeCompare(a.lastBetDate); break;
      case "gains": cmp = b.netProfit - a.netProfit; break;
      case "paris": cmp = b.betsCount - a.betsCount; break;
    }
    return sortAsc ? -cmp : cmp;
  });

  function toggleExpand(key: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleSeriesShowAll(key: string) {
    setSeriesShowAll((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }


  function handleValidate(betId: string, result: "gagne" | "perdu") {
    startTransition(async () => {
      const res = await validateResult(betId, result);
      if (result === "gagne" && !res?.error) fireConfetti();
    });
  }

  const renderCard = (eq: MergedEquipe, keyPrefix: string) => {
    const cardKey = `${keyPrefix}${eq.name}:::${eq.bet_type}`;
    return (
      <EquipeCard
        key={cardKey}
        eq={eq}
        logoMap={logoMap}
        nextFixture={nextFixtureMap[eq.name]}
        isExpanded={expandedIds.has(cardKey)}
        showAllSeries={seriesShowAll.has(cardKey)}
        onToggleExpand={() => toggleExpand(cardKey)}
        onToggleShowAllSeries={() => toggleSeriesShowAll(cardKey)}
        onEdit={() => setEditEquipe(eq)}
        onOpenBet={() => openBetModal({ subject: eq.name, betType: eq.bet_type, sport: eq.sport })}
        onValidate={handleValidate}
        onDeleteEmpty={async () => {
          await deleteEquipe(eq.equipeId);
          startTransition(() => { router.refresh(); });
        }}
      />
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Search (toggle) */}
      {searchOpen && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm text-secondary-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {/* Filter tabs + Mes équipes (droite) */}
      <div className="flex items-center gap-1.5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filterBy === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setFilterBy(isActive ? null : opt.key)}
                className={cn(
                  "flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border",
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
          onClick={() => setMyTeamsOpen(true)}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:border-primary/50 transition-colors"
        >
          <Users className="h-3.5 w-3.5" /> Mes équipes
        </button>
      </div>

      {/* Sort + search (loupe à droite) */}
      <div className="flex items-stretch gap-1.5">
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortBy === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handleSort(opt.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                isActive
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:border-border/80"
              )}
            >
              {opt.label}
              {isActive && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
            </button>
          );
        })}
        <button
          onClick={() => setSearchOpen((o) => !o)}
          aria-label="Rechercher"
          className={cn(
            "flex-shrink-0 w-10 flex items-center justify-center rounded-lg border transition-colors",
            searchOpen
              ? "bg-primary/10 border-primary/40 text-primary"
              : "bg-card border-border text-secondary-foreground hover:text-foreground"
          )}
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-10 w-10 mb-3 text-muted-foreground" />
          <p className="text-sm">Aucune equipe trouvee.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((eq) => renderCard(eq, ""))}
        </div>
      )}

      {/* === Mes équipes Dialog === */}
      <Dialog open={myTeamsOpen} onOpenChange={setMyTeamsOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-md mx-auto max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Mes équipes</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ajoute des équipes API et gère tes favoris
            </DialogDescription>
          </DialogHeader>
          <FollowedTeams teamMappings={teamMappings} />
        </DialogContent>
      </Dialog>

      {/* === Edit Equipe Dialog (sport) === */}
      <Dialog open={editEquipe !== null} onOpenChange={(open) => { if (!open) setEditEquipe(null); }}>
        <DialogContent className="bg-card border border-border text-foreground max-w-md mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Modifier {editEquipe?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Sport de l&apos;équipe
            </DialogDescription>
          </DialogHeader>
          {editEquipe && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Sport</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(SPORTS) as [string, string][]).map(([sKey, sLabel]) => (
                  <button
                    key={sKey}
                    onClick={async () => {
                      await updateEquipeSport(editEquipe.equipeId, sKey);
                      setEditEquipe(null);
                      startTransition(() => { router.refresh(); });
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors border",
                      editEquipe.sport === sKey
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "bg-background text-muted-foreground border-border hover:border-border/80"
                    )}
                  >
                    <span>{SPORT_EMOJIS[sKey]}</span>
                    {sLabel}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
