"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { deleteEquipe, updateEquipeSport } from "@/actions/equipes";
import { validateResult } from "@/actions/bets";
import { fireConfetti } from "@/lib/confetti";
import { useBetModal } from "@/components/paris/bet-modal-provider";
import { TeamLogo } from "@/components/ui/team-logo";
import { RollingNumber } from "@/components/ui/rolling-number";
import { FollowedTeams } from "@/components/profile/followed-teams";
import { EquipeCard, type MergedEquipe } from "./equipe-card";
import type { TeamMapping } from "@/actions/teams";
import { SPORTS, SPORT_EMOJIS } from "@/lib/constants";
import { formatPercent, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
  ChevronUp,
  Inbox,
  Users,
} from "lucide-react";

export interface EntityLite {
  id: string;
  name: string;
  logoUrl: string | null;
  kind: string;
}

type TypeFilter = "all" | "club" | "national" | "standalone";

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "club", label: "Clubs" },
  { key: "national", label: "Nations" },
  { key: "standalone", label: "Sans lien" },
];

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
  subjectEntities?: Record<string, EntityLite[]>;
}

export function EquipesPage({ equipes, logoMap, nextFixtureMap = {}, teamMappings = [], subjectEntities = {} }: EquipesPageProps) {
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
  const [clubExpanded, setClubExpanded] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
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

  function toggleClub(id: string) {
    setClubExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Regroupement par club/nation (une équipe liée à club + pays apparaît dans les deux)
  const groupMap = new Map<
    string,
    { entity: EntityLite; equipes: MergedEquipe[]; net: number; stake: number; hasActive: boolean }
  >();
  const standalone: MergedEquipe[] = [];
  for (const eq of sorted) {
    const ents = subjectEntities[eq.name] ?? [];
    if (ents.length === 0) {
      standalone.push(eq);
      continue;
    }
    for (const ent of ents) {
      const g =
        groupMap.get(ent.id) ??
        { entity: ent, equipes: [], net: 0, stake: 0, hasActive: false };
      g.equipes.push(eq);
      g.net += eq.netProfit;
      g.stake += eq.totalStake;
      if (eq.activeSeries) g.hasActive = true;
      groupMap.set(ent.id, g);
    }
  }
  const clubGroups = Array.from(groupMap.values())
    .map((g) => ({
      ...g,
      net: Math.round(g.net * 100) / 100,
      roi: g.stake > 0 ? (g.net / g.stake) * 100 : 0,
    }))
    .sort((a, b) => (a.hasActive !== b.hasActive ? (a.hasActive ? -1 : 1) : b.net - a.net));

  const visibleClubGroups =
    typeFilter === "standalone"
      ? []
      : clubGroups.filter((g) => typeFilter === "all" || g.entity.kind === typeFilter);
  const showStandalone = typeFilter === "all" || typeFilter === "standalone";

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
      {/* Mes équipes */}
      <button
        onClick={() => setMyTeamsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-secondary-foreground hover:border-primary/50 transition-colors"
      >
        <Users className="h-4 w-4" /> Mes équipes
      </button>

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

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
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

      {/* Filtre général : clubs / nations / sans lien */}
      <div className="flex gap-1.5">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTypeFilter(t.key)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              typeFilter === t.key
                ? "bg-primary/20 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border hover:border-border/80"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-10 w-10 mb-3 text-muted-foreground" />
          <p className="text-sm">Aucune equipe trouvee.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Groupes club / nation */}
          {visibleClubGroups.map((group) => {
            const gExpanded = clubExpanded.has(group.entity.id);
            return (
              <div key={group.entity.id} className="rounded-xl bg-card border border-border overflow-hidden">
                <button
                  onClick={() => toggleClub(group.entity.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-foreground/[0.02] transition-colors"
                >
                  <TeamLogo logoUrl={group.entity.logoUrl ?? undefined} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground truncate">{group.entity.name}</span>
                      {group.entity.kind === "national" && (
                        <Badge className="shrink-0 bg-info/20 text-info border-info/30 text-[10px] px-1.5 py-0">
                          Nation
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {group.equipes.length} équipe{group.equipes.length > 1 ? "s" : ""} · ROI {formatPercent(group.roi)}
                    </span>
                  </div>
                  <span className={cn("font-bold text-sm", group.net >= 0 ? "text-primary" : "text-destructive")}>
                    {group.net >= 0 ? "+" : ""}
                    <RollingNumber value={group.net} format="euros" />
                  </span>
                  {gExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {gExpanded && (
                  <div className="border-t border-border/50 p-2 space-y-2">
                    {group.equipes.map((eq) => renderCard(eq, `${group.entity.id}:`))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Sans lien club */}
          {showStandalone && standalone.map((eq) => renderCard(eq, "solo:"))}
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
