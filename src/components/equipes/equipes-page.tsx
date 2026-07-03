"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { deleteEquipe, updateEquipeSport } from "@/actions/equipes";
import { validateResult } from "@/actions/bets";
import { fireConfetti } from "@/lib/confetti";
import { useBetModal } from "@/components/paris/bet-modal-provider";
import { TeamLogo } from "@/components/ui/team-logo";
import { RollingNumber } from "@/components/ui/rolling-number";
import { EquipeSeriesItem } from "@/components/series/equipe-series-item";
import type { EquipeSeries } from "@/components/series/equipes-list";
import { BET_TYPES, SPORTS, SPORT_EMOJIS } from "@/lib/constants";
import { formatEuros, formatPercent, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Inbox,
  TrendingUp,
  CalendarClock,
  CheckCircle,
  XCircle,
} from "lucide-react";

// === Types ===

export interface MergedEquipe {
  equipeId: string;
  name: string;
  bet_type: string;
  sport: string;
  totalStake: number;
  netProfit: number;
  roi: number;
  seriesCount: number;
  betsCount: number;
  wonCount: number;
  abandonedCount: number;
  enCoursCount: number;
  series: EquipeSeries[];
  lastBetDate: string;
  lastSeriesStatus: string;
  totalWonAmount: number;
  totalLostStake: number;
  potentialGains: number;
  activeSeries: {
    id: string;
    target_gain: number;
    betCount: number;
    sumStakes: number;
    hasPendingBet: boolean;
  } | null;
}

type SortKey = "date" | "gains" | "paris";
type FilterKey = "en_cours" | "gagne" | "perdu" | "pause" | null;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Récent" },
  { key: "gains", label: "Gains" },
  { key: "paris", label: "Paris" },
];

const FILTER_OPTIONS: {
  key: "en_cours" | "gagne" | "perdu" | "pause";
  label: string;
  color: string;
  activeColor: string;
}[] = [
  { key: "en_cours", label: "En cours", color: "text-info border-info/30", activeColor: "bg-info/20" },
  { key: "gagne", label: "Gagné", color: "text-primary border-primary/30", activeColor: "bg-primary/20" },
  { key: "perdu", label: "Perdu", color: "text-destructive border-destructive/30", activeColor: "bg-destructive/20" },
  { key: "pause", label: "En pause", color: "text-warning border-warning/30", activeColor: "bg-warning/20" },
];

interface EquipesPageProps {
  equipes: MergedEquipe[];
  logoMap: Record<string, string>;
  nextFixtureMap?: Record<string, { date: string }>;
}

function formatFixtureDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month} a ${hours}h${minutes}`;
}

export function EquipesPage({ equipes, logoMap, nextFixtureMap = {} }: EquipesPageProps) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Filters & sort
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterBy, setFilterBy] = useState<FilterKey>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [editEquipe, setEditEquipe] = useState<MergedEquipe | null>(null);
  const [seriesShowAll, setSeriesShowAll] = useState<Set<string>>(new Set());

  const { open: openBetModal } = useBetModal();

  // === Sort/Filter logic ===

  function handleSort(key: SortKey) {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  }

  const counts = useMemo(() => {
    const c = { en_cours: 0, gagne: 0, perdu: 0, pause: 0 };
    for (const eq of equipes) {
      if (eq.enCoursCount > 0) c.en_cours++;
      if (eq.netProfit > 0) c.gagne++;
      if (eq.netProfit < 0) c.perdu++;
      if (eq.lastSeriesStatus === "abandonnee" && eq.enCoursCount === 0) c.pause++;
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
      case "pause": return eq.lastSeriesStatus === "abandonnee" && eq.enCoursCount === 0;
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

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="h-10 w-10 mb-3 text-muted-foreground" />
          <p className="text-sm">Aucune equipe trouvee.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((eq) => {
            const key = `${eq.name}:::${eq.bet_type}`;
            const isExpanded = expandedIds.has(key);
            const betTypeLabel = BET_TYPES[eq.bet_type as keyof typeof BET_TYPES] ?? eq.bet_type;

            const barTotal = eq.totalWonAmount + eq.totalLostStake + eq.potentialGains;
            const wonPct = barTotal > 0 ? (eq.totalWonAmount / barTotal) * 100 : 0;
            const lostPct = barTotal > 0 ? (eq.totalLostStake / barTotal) * 100 : 0;
            const pendingPct = barTotal > 0 ? (eq.potentialGains / barTotal) * 100 : 0;

            const nextFixture = nextFixtureMap[eq.name];
            const showBanner = !!eq.activeSeries;
            const canBetFromBanner = !!(eq.activeSeries && !eq.activeSeries.hasPendingBet);
            const activeSeriesFull = eq.activeSeries
              ? eq.series.find((s) => s.id === eq.activeSeries!.id)
              : null;
            const pendingBet =
              activeSeriesFull?.bets.find((b) => b.result === null) ?? null;

            return (
              <div
                key={key}
                className={cn(
                  "rounded-xl bg-card overflow-hidden",
                  eq.activeSeries && "border border-primary/30"
                )}
              >
                {/* Bandeau série en cours (+ prochain match si dispo) */}
                {showBanner && (
                  <div className="flex items-center justify-between px-3 py-2 bg-info/10 border-b border-info/20">
                    <div className="flex items-center gap-1.5 text-xs text-info">
                      <CalendarClock className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {nextFixture
                          ? `Prochain match : ${formatFixtureDateTime(nextFixture.date)}`
                          : "Série en cours"}
                      </span>
                    </div>
                    {canBetFromBanner && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openBetModal({ subject: eq.name, betType: eq.bet_type, sport: eq.sport }); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Ajouter pari
                      </button>
                    )}
                  </div>
                )}

                {/* Card header */}
                <div className="p-3 space-y-2">
                  {/* Row 1: logo (edit) + name+type (expand) + profit (expand) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => setEditEquipe(eq)}
                        aria-label="Modifier l'équipe"
                        className="shrink-0 transition-transform active:scale-95"
                      >
                        <TeamLogo logoUrl={logoMap[eq.name]} sport={eq.sport} size="sm" />
                      </button>
                      <button
                        onClick={() => toggleExpand(key)}
                        className="flex items-center gap-2 min-w-0 text-left"
                      >
                        <span className="text-base font-bold text-foreground truncate">{eq.name}</span>
                        <Badge className="shrink-0 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                          {betTypeLabel}
                        </Badge>
                      </button>
                    </div>
                    <button
                      onClick={() => toggleExpand(key)}
                      className="flex items-center gap-2 shrink-0"
                    >
                      <span className={cn("font-bold text-sm", eq.netProfit >= 0 ? "text-primary" : "text-destructive")}>
                        {eq.netProfit >= 0 ? "+" : ""}
                        <RollingNumber value={eq.netProfit} format="euros" />
                      </span>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>

                  {/* Row 2: stats + ROI or empty alert */}
                  {eq.seriesCount === 0 ? (
                    <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-warning/10 border border-warning/20">
                      <span className="text-xs text-warning">Pas de série créée</span>
                      <button
                        onClick={async () => {
                          await deleteEquipe(eq.equipeId);
                          startTransition(() => { router.refresh(); });
                        }}
                        className="text-xs text-destructive hover:text-destructive/80 cursor-pointer"
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {eq.seriesCount} serie{eq.seriesCount > 1 ? "s" : ""} · {eq.betsCount} pari{eq.betsCount > 1 ? "s" : ""}
                        {eq.activeSeries && (
                          <span className="text-info ml-2">
                            <TrendingUp className="h-3 w-3 inline" /> en cours (#{eq.activeSeries.betCount})
                          </span>
                        )}
                      </span>
                      <span className={cn("text-xs font-medium", eq.roi >= 0 ? "text-primary/70" : "text-destructive/70")}>
                        ROI {formatPercent(eq.roi)}
                      </span>
                    </div>
                  )}

                  {/* Row 3: progress bar */}
                  {barTotal > 0 && (
                    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-muted/50">
                      {wonPct > 0 && <div className="bg-primary" style={{ width: `${wonPct}%` }} />}
                      {lostPct > 0 && <div className="bg-destructive" style={{ width: `${lostPct}%` }} />}
                      {pendingPct > 0 && <div className="bg-info" style={{ width: `${pendingPct}%` }} />}
                    </div>
                  )}

                  {/* Pari en cours (sous la barre de progression) */}
                  {pendingBet && (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-info/10 border border-info/20 p-2">
                      <div className="flex items-center gap-2 min-w-0 text-xs text-secondary-foreground">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-info/20 text-info text-[11px] font-bold">
                          {pendingBet.bet_number}
                        </span>
                        <span>Cote {pendingBet.odds.toFixed(2)}</span>
                        <span className="text-muted-foreground">· {formatEuros(pendingBet.stake)}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleValidate(pendingBet.id, "gagne"); }}
                          className="flex items-center gap-1 rounded-lg bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/25 transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Gagné
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleValidate(pendingBet.id, "perdu"); }}
                          className="flex items-center gap-1 rounded-lg bg-destructive/15 px-2 py-1 text-[11px] font-semibold text-destructive hover:bg-destructive/25 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Perdu
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded: nouvelle série (top) + séries (récente + voir plus) */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-3 pb-3 pt-2 space-y-1.5">
                    {!eq.activeSeries && (
                      <button
                        onClick={() => openBetModal({ subject: eq.name, betType: eq.bet_type, sport: eq.sport })}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Nouvelle serie
                      </button>
                    )}

                    {(() => {
                      const ordered = [...eq.series].sort((a, b) =>
                        b.created_at.localeCompare(a.created_at)
                      );
                      const showAll = seriesShowAll.has(key);
                      const visible = showAll ? ordered : ordered.slice(0, 1);
                      return (
                        <>
                          {visible.map((s) => (
                            <div key={s.id}>
                              <EquipeSeriesItem series={s} />
                              {s.status === "en_cours" && !eq.activeSeries?.hasPendingBet && (
                                <button
                                  onClick={() => openBetModal({ subject: eq.name, betType: eq.bet_type, sport: eq.sport })}
                                  className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Parier
                                </button>
                              )}
                            </div>
                          ))}
                          {ordered.length > 1 && (
                            <button
                              onClick={() => toggleSeriesShowAll(key)}
                              className="w-full py-1 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showAll ? "Voir moins" : `Voir plus (${ordered.length - 1})`}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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
