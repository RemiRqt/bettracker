"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createBetEntry } from "@/actions/bets";
import type { SportType } from "@/lib/types";
import { computePotentialNet } from "@/lib/bet-calc";
import type { PickedFixture } from "./fixture-picker";
import { useMarketOdds } from "./use-market-odds";
import { useTeamSelection } from "./use-team-selection";
import { amountHandlers, useBetAmounts } from "./use-bet-amounts";
import type { BetFormProps, BetMode } from "./bet-form-types";

export const ERREUR_COTE = "La cote doit être supérieure à 1.";
export const ERREUR_MISE = "Renseigne une mise.";

// État complet du formulaire de pari : sujet, mode, montants, match, cotes du marché, envoi.
export function useBetFormState({ existingSubjects, teamMappings, lockedSeries, prefill, onSuccess }: BetFormProps) {
  const amounts = useBetAmounts();
  const team = useTeamSelection({
    existingSubjects,
    teamMappings,
    lockedSeries,
    prefill,
    resetAmounts: amounts.resetAmounts,
  });
  const [modeChoice, setModeChoice] = useState<"serie" | "unique">("serie");
  const [fixture, setFixture] = useState<PickedFixture | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorId = `${useId()}-erreur`;
  const [isPending, startTransition] = useTransition();
  const { selectedSubject, apiTeam } = team;

  // Un sujet est résolu (sélection existante, création, ou équipe API) → on déroule le form.
  const resolved = !!lockedSeries || !!selectedSubject || !!apiTeam || team.createdNew;

  const activeCtx = lockedSeries
    ? { targetGain: lockedSeries.targetGain, betCount: lockedSeries.betCount, sumStakes: lockedSeries.sumStakes }
    : selectedSubject?.activeSeries ?? null;

  const mode: BetMode = lockedSeries
    ? "resume"
    : modeChoice === "unique"
    ? "unique"
    : activeCtx
    ? "resume"
    : "serie";

  const effectiveBetType =
    lockedSeries?.betType ??
    selectedSubject?.betType ??
    (team.betType === "autre" ? team.betTypeCustom.trim() : team.betType);

  // Contexte martingale (resume : pari #n, somme S, cible T ; serie : n=1, S=0, T=slider)
  const n = mode === "resume" ? activeCtx!.betCount + 1 : 1;
  const S = mode === "resume" ? activeCtx!.sumStakes : 0;
  const T = mode === "resume" ? activeCtx!.targetGain : amounts.targetGain;
  const calc = amountHandlers(amounts, { mode, n, S, T });
  const { o, validOdds } = calc;
  const serieGain = validOdds && amounts.stake !== "" ? computePotentialNet(parseFloat(amounts.stake) || 0, o, S) : 0;

  // Équipe API connue → choix du match (suggestion auto du résultat).
  const fixtureTeamId =
    team.sport === "football"
      ? apiTeam?.apiTeamId ?? selectedSubject?.apiTeamId ?? lockedSeries?.apiTeamId ?? null
      : null;

  // Cotes du marché (The Odds API) : préremplit la cote si elle est vide.
  const oddsRef = useRef(amounts.odds);
  useEffect(() => {
    oddsRef.current = amounts.odds;
  });
  const market = useMarketOdds(fixtureTeamId ? fixture : null, fixtureTeamId, effectiveBetType, (best) => {
    if (!oddsRef.current) calc.onOddsChange(String(best));
  });

  const subjectName = (apiTeam?.subject ?? lockedSeries?.subject ?? team.name).trim();

  function chooseMode(m: "serie" | "unique") {
    setModeChoice(m);
    amounts.resetAmounts();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const subject = subjectName;
    if (!subject) return setError("Le nom est requis.");
    if (!effectiveBetType) return setError("Choisis un type de pari.");
    if (!validOdds) return setError(ERREUR_COTE);
    if (mode === "serie" && amounts.targetGain <= 0) return setError("Définis un objectif de gain.");
    if ((mode === "unique" || mode === "resume") && amounts.stake === "") return setError(ERREUR_MISE);

    const payload = {
      subject,
      betType: effectiveBetType,
      sport: team.sport as SportType,
      mode,
      odds: o,
      targetGain: mode === "serie" ? amounts.targetGain : undefined,
      stake: amounts.stake !== "" ? parseFloat(amounts.stake) || undefined : undefined,
      apiTeam: apiTeam
        ? {
            apiTeamId: apiTeam.apiTeamId,
            crestUrl: apiTeam.logoUrl,
            kind: apiTeam.kind,
            country: apiTeam.country ?? undefined,
          }
        : undefined,
      fixture: fixtureTeamId ? fixture : null,
      marketOdds: market.status === "ready" ? market.data.prices : null,
    };

    startTransition(async () => {
      const res = await createBetEntry(payload);
      if (res && "error" in res) {
        setError(res.error ?? "Une erreur est survenue.");
        return;
      }
      onSuccess?.();
    });
  }

  return {
    team,
    amounts,
    calc,
    modeChoice,
    chooseMode,
    mode,
    activeCtx,
    resolved,
    effectiveBetType,
    subjectName,
    n,
    S,
    T,
    serieGain,
    fixtureTeamId,
    fixture,
    setFixture,
    market,
    error,
    errorId,
    isPending,
    handleSubmit,
  };
}

export type BetFormState = ReturnType<typeof useBetFormState>;
