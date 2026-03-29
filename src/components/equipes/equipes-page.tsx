"use client";

import { useState, useTransition, useCallback } from "react";
import type { EquipeWithContext } from "@/actions/equipes";
import { createEquipe, deleteEquipe, placeBet } from "@/actions/equipes";
import { TeamLogo } from "@/components/ui/team-logo";
import { BET_TYPES } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  TrendingUp,
  Target,
  Loader2,
  ChevronRight,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EquipesPageProps {
  equipes: EquipeWithContext[];
  logoMap: Record<string, string>;
}

export function EquipesPage({
  equipes: initialEquipes,
  logoMap,
}: EquipesPageProps) {
  const [equipes, setEquipes] = useState(initialEquipes);
  const [, startTransition] = useTransition();

  // Create equipe dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBetType, setNewBetType] = useState("victoire");
  const [createError, setCreateError] = useState("");

  // Bet dialog
  const [betEquipe, setBetEquipe] = useState<EquipeWithContext | null>(null);
  const [betStep, setBetStep] = useState<"target" | "odds">("odds");
  const [targetGain, setTargetGain] = useState("");
  const [odds, setOdds] = useState("");
  const [stakeOverride, setStakeOverride] = useState("");
  const [calculatedStake, setCalculatedStake] = useState<number | null>(null);
  const [isBetting, setIsBetting] = useState(false);
  const [betError, setBetError] = useState("");

  // === Create Equipe ===
  const handleCreate = useCallback(async () => {
    setCreateError("");
    const result = await createEquipe(newName, newBetType);
    if (result.error) {
      setCreateError(result.error);
      return;
    }
    setCreateOpen(false);
    setNewName("");
    setNewBetType("victoire");
    // Refresh page
    startTransition(() => {
      window.location.reload();
    });
  }, [newName, newBetType]);

  // === Delete Equipe ===
  const handleDelete = useCallback(
    (eq: EquipeWithContext) => {
      if (!confirm(`Supprimer "${eq.name} - ${BET_TYPES[eq.bet_type as keyof typeof BET_TYPES]}" ?`))
        return;
      setEquipes((prev) => prev.filter((e) => e.id !== eq.id));
      startTransition(async () => {
        await deleteEquipe(eq.id);
      });
    },
    []
  );

  // === Open Bet Dialog ===
  const openBetDialog = useCallback((eq: EquipeWithContext) => {
    setBetEquipe(eq);
    setBetError("");
    setOdds("");
    setStakeOverride("");
    setCalculatedStake(null);

    if (eq.activeSeries && !eq.activeSeries.hasPendingBet) {
      // Active series without pending bet → go straight to odds
      setBetStep("odds");
      setTargetGain(String(eq.activeSeries.target_gain));
    } else if (!eq.activeSeries) {
      // No active series → ask for target gain first
      setBetStep("target");
      setTargetGain("");
    } else {
      // Has pending bet → shouldn't open, but handle gracefully
      setBetEquipe(null);
    }
  }, []);

  // === Calculate Stake ===
  const calculateStake = useCallback(() => {
    const o = parseFloat(odds);
    if (!o || o <= 1 || !betEquipe) return;

    const T = parseFloat(targetGain);
    if (!T || T <= 0) return;

    let n: number;
    let sumPrev: number;

    if (betEquipe.activeSeries) {
      n = betEquipe.activeSeries.betCount + 1;
      sumPrev = betEquipe.activeSeries.sumStakes;
    } else {
      n = 1;
      sumPrev = 0;
    }

    const stake = Math.round(((n * T + sumPrev) / (o - 1)) * 100) / 100;
    setCalculatedStake(stake);
    setStakeOverride("");
  }, [odds, targetGain, betEquipe]);

  // === Submit Bet ===
  const handlePlaceBet = useCallback(async () => {
    if (!betEquipe) return;
    const o = parseFloat(odds);
    if (!o || o <= 1) {
      setBetError("Cote invalide.");
      return;
    }

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

    if (result.error) {
      setBetError(result.error);
      return;
    }

    setBetEquipe(null);
    startTransition(() => {
      window.location.reload();
    });
  }, [betEquipe, odds, stakeOverride, targetGain]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold text-slate-100 font-[family-name:var(--font-poppins)]">
          Equipes
        </h1>
        <button
          onClick={() => {
            setCreateOpen(true);
            setCreateError("");
            setNewName("");
            setNewBetType("victoire");
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b981] text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle equipe
        </button>
      </div>

      {/* Empty state */}
      {equipes.length === 0 && (
        <div className="rounded-xl bg-[#1e293b] p-6 text-center space-y-3">
          <Target className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">Aucune equipe creee.</p>
          <p className="text-xs text-slate-500">
            Creez votre premiere equipe pour commencer a parier.
          </p>
        </div>
      )}

      {/* Equipes list */}
      <div className="space-y-2">
        {equipes.map((eq) => (
          <EquipeCard
            key={eq.id}
            equipe={eq}
            logoUrl={logoMap[eq.name]}
            onBet={() => openBetDialog(eq)}
            onDelete={() => handleDelete(eq)}
          />
        ))}
      </div>

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
              <label className="text-xs text-slate-400 mb-1.5 block">
                Type de pari
              </label>
              <div className="flex gap-2">
                {(
                  Object.entries(BET_TYPES) as [string, string][]
                ).map(([key, label]) => (
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

            {createError && (
              <p className="text-xs text-red-400">{createError}</p>
            )}

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
      <Dialog
        open={betEquipe !== null}
        onOpenChange={(open) => {
          if (!open) setBetEquipe(null);
        }}
      >
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {betEquipe?.activeSeries
                ? `Pari #${betEquipe.activeSeries.betCount + 1}`
                : "Nouvelle serie"}
              {" — "}
              {betEquipe?.name}
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
                    <label className="text-xs text-slate-400 mb-1.5 block">
                      Gain souhaite par pari (€)
                    </label>
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
                    onClick={() => {
                      const t = parseFloat(targetGain);
                      if (t > 0) setBetStep("odds");
                    }}
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
                  {/* Series info for active series */}
                  {betEquipe.activeSeries && (
                    <div className="bg-[#0f172a] rounded-xl p-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Gain cible</span>
                        <span className="text-white">
                          {betEquipe.activeSeries.target_gain}€
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">
                          Mises precedentes
                        </span>
                        <span className="text-white">
                          {betEquipe.activeSeries.sumStakes.toFixed(2)}€
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Pari n°</span>
                        <span className="text-white">
                          {betEquipe.activeSeries.betCount + 1}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* New series info */}
                  {!betEquipe.activeSeries && (
                    <div className="bg-[#0f172a] rounded-xl p-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Gain cible</span>
                        <span className="text-white">{targetGain}€</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">
                      Cote
                    </label>
                    <input
                      type="number"
                      value={odds}
                      onChange={(e) => {
                        setOdds(e.target.value);
                        setCalculatedStake(null);
                      }}
                      onBlur={calculateStake}
                      placeholder="Ex: 2.10"
                      step="0.01"
                      min="1.01"
                      className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                      autoFocus
                    />
                  </div>

                  {/* Calculate button */}
                  {odds && parseFloat(odds) > 1 && calculatedStake === null && (
                    <button
                      onClick={calculateStake}
                      className="w-full py-2 rounded-xl border border-[#10b981] text-[#10b981] text-sm hover:bg-[#10b981]/10 transition-colors"
                    >
                      Calculer la mise
                    </button>
                  )}

                  {/* Calculated stake */}
                  {calculatedStake !== null && (
                    <div className="space-y-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                        <p className="text-xs text-emerald-400 mb-1">
                          Mise calculee
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {calculatedStake.toFixed(2)}€
                        </p>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block">
                          Mise modifiee (optionnel)
                        </label>
                        <input
                          type="number"
                          value={stakeOverride}
                          onChange={(e) => setStakeOverride(e.target.value)}
                          placeholder={`${calculatedStake.toFixed(2)}`}
                          step="0.01"
                          min="0.01"
                          className="w-full bg-[#0f172a] border border-slate-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                        />
                      </div>

                      {betError && (
                        <p className="text-xs text-red-400">{betError}</p>
                      )}

                      <button
                        onClick={handlePlaceBet}
                        disabled={isBetting}
                        className="w-full py-2.5 rounded-xl bg-[#10b981] text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isBetting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Valider le pari"
                        )}
                      </button>
                    </div>
                  )}

                  {/* Back button for new series */}
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

// === Equipe Card ===

function EquipeCard({
  equipe,
  logoUrl,
  onBet,
  onDelete,
}: {
  equipe: EquipeWithContext;
  logoUrl?: string;
  onBet: () => void;
  onDelete: () => void;
}) {
  const hasPending = equipe.activeSeries?.hasPendingBet;

  return (
    <div className="rounded-xl bg-[#1e293b] p-3">
      <div className="flex items-center gap-3">
        <TeamLogo logoUrl={logoUrl} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-white truncate">
              {equipe.name}
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 whitespace-nowrap">
              {BET_TYPES[equipe.bet_type as keyof typeof BET_TYPES]}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-0.5">
            {equipe.activeSeries ? (
              <Link
                href={`/series/${equipe.activeSeries.id}`}
                className="flex items-center gap-1 text-xs text-[#10b981] hover:text-emerald-300"
              >
                <TrendingUp className="h-3 w-3" />
                Serie en cours (pari #{equipe.activeSeries.betCount})
              </Link>
            ) : (
              <span className="text-xs text-slate-500">Aucune serie active</span>
            )}

            {equipe.stats.seriesCount > 0 && (
              <span className="text-xs text-slate-500">
                <Hash className="h-3 w-3 inline" />
                {equipe.stats.seriesCount} serie{equipe.stats.seriesCount > 1 ? "s" : ""}
              </span>
            )}

            {equipe.stats.netProfit !== 0 && (
              <span
                className={cn(
                  "text-xs font-medium",
                  equipe.stats.netProfit > 0
                    ? "text-emerald-400"
                    : "text-red-400"
                )}
              >
                {equipe.stats.netProfit > 0 ? "+" : ""}
                {equipe.stats.netProfit.toFixed(2)}€
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {!hasPending && (
            <button
              onClick={onBet}
              className="px-3 py-1.5 rounded-lg bg-[#10b981] text-white text-xs font-medium hover:bg-emerald-600 transition-colors"
            >
              Parier
            </button>
          )}

          {hasPending && equipe.activeSeries && (
            <Link
              href={`/series/${equipe.activeSeries.id}`}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors flex items-center gap-1"
            >
              En attente
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}

          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <Trash2 className="h-4 w-4 text-slate-600 hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
