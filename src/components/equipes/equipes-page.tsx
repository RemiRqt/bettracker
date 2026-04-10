"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { createEquipe, deleteEquipe, placeBet } from "@/actions/equipes";
import { TeamLogo } from "@/components/ui/team-logo";
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
  Loader2,
  TrendingUp,
  CalendarClock,
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
  { key: "en_cours", label: "En cours", color: "text-blue-400 border-blue-500/30", activeColor: "bg-blue-500/20" },
  { key: "gagne", label: "Gagné", color: "text-emerald-400 border-emerald-500/30", activeColor: "bg-emerald-500/20" },
  { key: "perdu", label: "Perdu", color: "text-red-400 border-red-500/30", activeColor: "bg-red-500/20" },
  { key: "pause", label: "En pause", color: "text-amber-400 border-amber-500/30", activeColor: "bg-amber-500/20" },
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

export function EquipesPage({ equipes: initialEquipes, logoMap, nextFixtureMap = {} }: EquipesPageProps) {
  const [equipes] = useState(initialEquipes);
  const [, startTransition] = useTransition();

  // Filters & sort
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterBy, setFilterBy] = useState<FilterKey>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Create equipe dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBetType, setNewBetType] = useState("victoire");
  const [newSport, setNewSport] = useState("football");
  const [createError, setCreateError] = useState("");

  // Bet dialog
  const [betEquipe, setBetEquipe] = useState<MergedEquipe | null>(null);
  const [betStep, setBetStep] = useState<"target" | "odds">("odds");
  const [targetGain, setTargetGain] = useState("");
  const [odds, setOdds] = useState("");
  const [stakeOverride, setStakeOverride] = useState("");
  const [calculatedStake, setCalculatedStake] = useState<number | null>(null);
  const [isBetting, setIsBetting] = useState(false);
  const [betError, setBetError] = useState("");

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

  // === Create Equipe ===
  const handleCreate = useCallback(async () => {
    setCreateError("");
    const result = await createEquipe(newName, newBetType, newSport);
    if (result.error) { setCreateError(result.error); return; }
    setCreateOpen(false);
    setNewName("");
    startTransition(() => { window.location.reload(); });
  }, [newName, newBetType, newSport]);

  // === Open Bet Dialog ===
  const openBetDialog = useCallback((eq: MergedEquipe) => {
    setBetEquipe(eq);
    setBetError("");
    setOdds("");
    setStakeOverride("");
    setCalculatedStake(null);
    if (eq.activeSeries && !eq.activeSeries.hasPendingBet) {
      setBetStep("odds");
      setTargetGain(String(eq.activeSeries.target_gain));
    } else {
      setBetStep("target");
      setTargetGain("");
    }
  }, []);

  // === Calculate Stake ===
  const calculateStake = useCallback(() => {
    const o = parseFloat(odds);
    if (!o || o <= 1 || !betEquipe) return;
    const T = parseFloat(targetGain);
    if (!T || T <= 0) return;
    const n = betEquipe.activeSeries ? betEquipe.activeSeries.betCount + 1 : 1;
    const sumPrev = betEquipe.activeSeries ? betEquipe.activeSeries.sumStakes : 0;
    const stake = Math.round(((n * T + sumPrev) / (o - 1)) * 100) / 100;
    setCalculatedStake(stake);
    setStakeOverride("");
  }, [odds, targetGain, betEquipe]);

  // === Submit Bet ===
  const handlePlaceBet = useCallback(async () => {
    if (!betEquipe) return;
    const o = parseFloat(odds);
    if (!o || o <= 1) { setBetError("Cote invalide."); return; }
    setIsBetting(true);
    setBetError("");
    const stakeOv = stakeOverride ? parseFloat(stakeOverride) : undefined;
    const tg = betEquipe.activeSeries ? undefined : parseFloat(targetGain);
    const result = await placeBet({
      equipeName: betEquipe.name,
      betType: betEquipe.bet_type,
      odds: o,
      stakeOverride: stakeOv,
      targetGain: tg,
    });
    setIsBetting(false);
    if (result.error) { setBetError(result.error); return; }
    setBetEquipe(null);
    startTransition(() => { window.location.reload(); });
  }, [betEquipe, odds, stakeOverride, targetGain]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100 font-[family-name:var(--font-poppins)]">
          Equipes
        </h1>
        <button
          onClick={() => { setCreateOpen(true); setCreateError(""); setNewName(""); setNewBetType("victoire"); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b981] text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#1e293b] border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

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
                  : "bg-transparent text-slate-500 border-slate-700/50 hover:border-slate-600"
              )}
            >
              {opt.label}
              <span className="ml-1 opacity-60">{counts[opt.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Sort buttons */}
      <div className="grid grid-cols-3 gap-1.5">
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortBy === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handleSort(opt.key)}
              className={cn(
                "flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                isActive
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-[#1e293b] text-slate-400 border-slate-700 hover:border-slate-600"
              )}
            >
              {opt.label}
              {isActive && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
            </button>
          );
        })}
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Inbox className="h-10 w-10 mb-3 text-slate-600" />
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
            const showFixtureBanner = !!(eq.activeSeries && nextFixture);
            const canBetFromBanner = !!(eq.activeSeries && !eq.activeSeries.hasPendingBet);

            return (
              <div key={key} className="rounded-xl bg-[#1e293b] overflow-hidden">
                {/* Next fixture banner (only when there's an active series + upcoming fixture) */}
                {showFixtureBanner && (
                  <div className="flex items-center justify-between px-3 py-2 bg-blue-500/10 border-b border-blue-500/20">
                    <div className="flex items-center gap-1.5 text-xs text-blue-300">
                      <CalendarClock className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        Prochain match : {formatFixtureDateTime(nextFixture.date)}
                      </span>
                    </div>
                    {canBetFromBanner && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openBetDialog(eq); }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Parier
                      </button>
                    )}
                  </div>
                )}

                {/* Card header - clickable to expand */}
                <button
                  onClick={() => toggleExpand(key)}
                  className="w-full text-left p-3 space-y-2 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  {/* Row 1: logo + name + type + action buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo logoUrl={logoMap[eq.name]} sport={eq.sport} size="sm" className="flex-shrink-0" />
                      <span className="text-base font-bold text-slate-100 truncate">{eq.name}</span>
                      <Badge className="shrink-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                        {betTypeLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("font-bold text-sm", eq.netProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {eq.netProfit >= 0 ? "+" : ""}{formatEuros(eq.netProfit)}
                      </span>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                    </div>
                  </div>

                  {/* Row 2: stats + ROI */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {eq.seriesCount} serie{eq.seriesCount > 1 ? "s" : ""} · {eq.betsCount} pari{eq.betsCount > 1 ? "s" : ""}
                      {eq.activeSeries && (
                        <span className="text-blue-400 ml-2">
                          <TrendingUp className="h-3 w-3 inline" /> en cours (#{eq.activeSeries.betCount})
                        </span>
                      )}
                    </span>
                    <span className={cn("text-xs font-medium", eq.roi >= 0 ? "text-emerald-400/70" : "text-red-400/70")}>
                      ROI {formatPercent(eq.roi)}
                    </span>
                  </div>

                  {/* Row 3: progress bar */}
                  {barTotal > 0 && (
                    <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-700/50">
                      {wonPct > 0 && <div className="bg-emerald-500" style={{ width: `${wonPct}%` }} />}
                      {lostPct > 0 && <div className="bg-red-500" style={{ width: `${lostPct}%` }} />}
                      {pendingPct > 0 && <div className="bg-blue-500" style={{ width: `${pendingPct}%` }} />}
                    </div>
                  )}
                </button>

                {/* Expanded: series list + action buttons */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50 px-3 pb-3 pt-2 space-y-1.5">
                    {eq.series.map((s) => (
                      <div key={s.id}>
                        <EquipeSeriesItem series={s} />
                        {/* "Parier" button below the active series */}
                        {s.status === "en_cours" && !eq.activeSeries?.hasPendingBet && (
                          <button
                            onClick={() => openBetDialog(eq)}
                            className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#10b981] text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Parier
                          </button>
                        )}
                      </div>
                    ))}

                    {/* "Nouvelle série" button at the bottom */}
                    {!eq.activeSeries && (
                      <button
                        onClick={() => openBetDialog(eq)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-600 text-xs text-slate-400 hover:border-[#10b981] hover:text-[#10b981] transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Nouvelle serie
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* === Create Equipe Dialog === */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Nouvelle equipe</DialogTitle>
            <DialogDescription className="text-slate-400">
              Creez une equipe avec un type de pari
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Nom</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: PSG, Cherki, France..."
                className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Type de pari</label>
              <div className="flex gap-2">
                {(Object.entries(BET_TYPES) as [string, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setNewBetType(key)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border",
                      newBetType === key
                        ? "bg-[#10b981] border-[#10b981] text-white"
                        : "bg-[#0f172a] border-slate-600 text-slate-400 hover:border-slate-500"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Sport</label>
              <div className="flex gap-2">
                {(Object.entries(SPORTS) as [string, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setNewSport(key)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border flex items-center justify-center gap-1",
                      newSport === key
                        ? "bg-[#10b981] border-[#10b981] text-white"
                        : "bg-[#0f172a] border-slate-600 text-slate-400 hover:border-slate-500"
                    )}
                  >
                    <span>{SPORT_EMOJIS[key]}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            {createError && <p className="text-xs text-red-400">{createError}</p>}
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="w-full py-2.5 rounded-xl bg-[#10b981] text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              Creer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* === Bet Creation Dialog === */}
      <Dialog open={betEquipe !== null} onOpenChange={(open) => { if (!open) setBetEquipe(null); }}>
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {betEquipe?.activeSeries
                ? `Pari #${betEquipe.activeSeries.betCount + 1}`
                : "Nouvelle serie"}{" — "}{betEquipe?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {betEquipe?.activeSeries
                ? `Serie en cours — Gain cible : ${betEquipe.activeSeries.target_gain}€`
                : "Definissez le gain souhaite puis saisissez la cote"}
            </DialogDescription>
          </DialogHeader>

          {betEquipe && (
            <div className="space-y-4">
              {/* Step: Target Gain (new series only) */}
              {betStep === "target" && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Gain souhaite par pari (€)</label>
                    <input
                      type="number"
                      value={targetGain}
                      onChange={(e) => setTargetGain(e.target.value)}
                      placeholder="Ex: 5"
                      step="0.5"
                      min="0.1"
                      className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => { if (parseFloat(targetGain) > 0) setBetStep("odds"); }}
                    disabled={!targetGain || parseFloat(targetGain) <= 0}
                    className="w-full py-2.5 rounded-xl bg-[#10b981] text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </>
              )}

              {/* Step: Odds + Stake */}
              {betStep === "odds" && (
                <>
                  {/* Series info */}
                  <div className="bg-[#0f172a] rounded-xl p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Gain cible</span>
                      <span className="text-white">{betEquipe.activeSeries?.target_gain ?? targetGain}€</span>
                    </div>
                    {betEquipe.activeSeries && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Mises precedentes</span>
                          <span className="text-white">{betEquipe.activeSeries.sumStakes.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Pari n°</span>
                          <span className="text-white">{betEquipe.activeSeries.betCount + 1}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Cote</label>
                    <input
                      type="number"
                      value={odds}
                      onChange={(e) => { setOdds(e.target.value); setCalculatedStake(null); }}
                      onBlur={calculateStake}
                      placeholder="Ex: 2.10"
                      step="0.01"
                      min="1.01"
                      className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                      autoFocus
                    />
                  </div>

                  {odds && parseFloat(odds) > 1 && calculatedStake === null && (
                    <button
                      onClick={calculateStake}
                      className="w-full py-2 rounded-xl border border-[#10b981] text-[#10b981] text-sm hover:bg-[#10b981]/10 transition-colors"
                    >
                      Calculer la mise
                    </button>
                  )}

                  {calculatedStake !== null && (
                    <div className="space-y-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                        <p className="text-xs text-emerald-400 mb-1">Mise calculee</p>
                        <p className="text-2xl font-bold text-white">{calculatedStake.toFixed(2)}€</p>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">Mise modifiee (optionnel)</label>
                        <input
                          type="number"
                          value={stakeOverride}
                          onChange={(e) => setStakeOverride(e.target.value)}
                          placeholder={calculatedStake.toFixed(2)}
                          step="0.01"
                          min="0.01"
                          className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                        />
                      </div>
                      {betError && <p className="text-xs text-red-400">{betError}</p>}
                      <button
                        onClick={handlePlaceBet}
                        disabled={isBetting}
                        className="w-full py-2.5 rounded-xl bg-[#10b981] text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isBetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider le pari"}
                      </button>
                    </div>
                  )}

                  {!betEquipe.activeSeries && (
                    <button
                      onClick={() => setBetStep("target")}
                      className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Retour
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
