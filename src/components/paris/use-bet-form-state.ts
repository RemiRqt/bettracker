"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createBetEntry } from "@/actions/bets";
import type { SportType } from "@/lib/types";
import { computePotentialNet } from "@/lib/bet-calc";
import type { PickedFixture } from "./fixture-picker";
import { useMarketOdds, type MarketOddsState } from "./use-market-odds";
import { useTeamSelection, type TeamSelection } from "./use-team-selection";
import { amountHandlers, useBetAmounts } from "./use-bet-amounts";
import type { BetFormProps, BetMode, LockedSeries } from "./bet-form-types";

export const ERREUR_COTE = "La cote doit être supérieure à 1.";
export const ERREUR_MISE = "Renseigne une mise.";

type Amounts = ReturnType<typeof useBetAmounts>;
type Calc = ReturnType<typeof amountHandlers>;

/** Mode effectif + contexte martingale (resume : pari #n, somme S, cible T ; serie : n=1, S=0, T=slider). */
function contexteMartingale(lockedSeries: LockedSeries | undefined, team: TeamSelection, modeChoice: "serie" | "unique", targetGain: number) {
  const activeCtx = lockedSeries
    ? { targetGain: lockedSeries.targetGain, betCount: lockedSeries.betCount, sumStakes: lockedSeries.sumStakes }
    : (team.selectedSubject?.activeSeries ?? null);
  const mode: BetMode = lockedSeries ? "resume" : modeChoice === "unique" ? "unique" : activeCtx ? "resume" : "serie";
  const reprise = mode === "resume" ? activeCtx : null;
  return {
    activeCtx,
    mode,
    n: reprise ? reprise.betCount + 1 : 1,
    S: reprise ? reprise.sumStakes : 0,
    T: reprise ? reprise.targetGain : targetGain,
  };
}

/** Données dérivées du sujet : type de pari retenu, nom, équipe API pour le choix du match. */
function deriveSujet(lockedSeries: LockedSeries | undefined, team: TeamSelection) {
  const { selectedSubject, apiTeam } = team;
  return {
    // Un sujet est résolu (sélection existante, création, ou équipe API) → on déroule le form.
    resolved: !!lockedSeries || !!selectedSubject || !!apiTeam || team.createdNew,
    effectiveBetType: lockedSeries?.betType ?? selectedSubject?.betType ?? (team.betType === "autre" ? team.betTypeCustom.trim() : team.betType),
    subjectName: (apiTeam?.subject ?? lockedSeries?.subject ?? team.name).trim(),
    // Équipe API connue → choix du match (suggestion auto du résultat).
    fixtureTeamId: team.sport === "football" ? (apiTeam?.apiTeamId ?? selectedSubject?.apiTeamId ?? lockedSeries?.apiTeamId ?? null) : null,
  };
}

// Cotes du marché (The Odds API) : préremplit la cote si elle est vide.
function useCotesMarche(amounts: Amounts, calc: Calc, fixture: PickedFixture | null, fixtureTeamId: number | null, betType: string) {
  const oddsRef = useRef(amounts.odds);
  useEffect(() => {
    oddsRef.current = amounts.odds;
  });
  return useMarketOdds(fixtureTeamId ? fixture : null, fixtureTeamId, betType, (best) => {
    if (!oddsRef.current) calc.onOddsChange(String(best));
  });
}

type Envoi = {
  subject: string;
  betType: string;
  mode: BetMode;
  team: TeamSelection;
  amounts: Amounts;
  calc: Calc;
  fixture: PickedFixture | null;
  market: MarketOddsState;
};

/** Message d'erreur de la saisie, ou null si elle peut partir. */
function erreurSaisie({ subject, betType, mode, amounts, calc }: Envoi): string | null {
  if (!subject) return "Le nom est requis.";
  if (!betType) return "Choisis un type de pari.";
  if (!calc.validOdds) return ERREUR_COTE;
  if (mode === "serie" && amounts.targetGain <= 0) return "Définis un objectif de gain.";
  if ((mode === "unique" || mode === "resume") && amounts.stake === "") return ERREUR_MISE;
  return null;
}

function payloadPari({ subject, betType, mode, team, amounts, calc, fixture, market }: Envoi) {
  const { apiTeam } = team;
  return {
    subject,
    betType,
    sport: team.sport as SportType,
    mode,
    odds: calc.o,
    targetGain: mode === "serie" ? amounts.targetGain : undefined,
    stake: amounts.stake !== "" ? parseFloat(amounts.stake) || undefined : undefined,
    apiTeam: apiTeam ? { apiTeamId: apiTeam.apiTeamId, crestUrl: apiTeam.logoUrl, kind: apiTeam.kind, country: apiTeam.country ?? undefined } : undefined,
    fixture,
    marketOdds: market.status === "ready" ? market.data.prices : null,
  };
}

// Envoi : validation locale, puis action serveur ; l'erreur s'affiche sous le formulaire.
function useEnvoiPari(onSuccess: (() => void) | undefined) {
  const [error, setError] = useState<string | null>(null);
  const errorId = `${useId()}-erreur`;
  const [isPending, startTransition] = useTransition();

  function envoyer(e: React.FormEvent, envoi: Envoi) {
    e.preventDefault();
    const erreur = erreurSaisie(envoi);
    setError(erreur);
    if (erreur) return;
    const payload = payloadPari(envoi);
    startTransition(async () => {
      const res = await createBetEntry(payload);
      if (res && "error" in res) {
        setError(res.error ?? "Une erreur est survenue.");
        return;
      }
      onSuccess?.();
    });
  }

  return { error, errorId, isPending, envoyer };
}

// État complet du formulaire de pari : sujet, mode, montants, match, cotes du marché, envoi.
export function useBetFormState({ existingSubjects, teamMappings, lockedSeries, prefill, onSuccess }: BetFormProps) {
  const amounts = useBetAmounts();
  const team = useTeamSelection({ existingSubjects, teamMappings, lockedSeries, prefill, resetAmounts: amounts.resetAmounts });
  const [modeChoice, setModeChoice] = useState<"serie" | "unique">("serie");
  const [fixture, setFixture] = useState<PickedFixture | null>(null);
  const { error, errorId, isPending, envoyer } = useEnvoiPari(onSuccess);

  const ctx = contexteMartingale(lockedSeries, team, modeChoice, amounts.targetGain);
  const sujet = deriveSujet(lockedSeries, team);
  const calc = amountHandlers(amounts, ctx);
  const serieGain = calc.validOdds && amounts.stake !== "" ? computePotentialNet(parseFloat(amounts.stake) || 0, calc.o, ctx.S) : 0;
  const market = useCotesMarche(amounts, calc, fixture, sujet.fixtureTeamId, sujet.effectiveBetType);

  function chooseMode(m: "serie" | "unique") {
    setModeChoice(m);
    amounts.resetAmounts();
  }

  const handleSubmit = (e: React.FormEvent) =>
    envoyer(e, {
      subject: sujet.subjectName,
      betType: sujet.effectiveBetType,
      mode: ctx.mode,
      team,
      amounts,
      calc,
      fixture: sujet.fixtureTeamId ? fixture : null,
      market,
    });

  return { team, amounts, calc, modeChoice, chooseMode, ...ctx, ...sujet, serieGain, fixture, setFixture, market, error, errorId, isPending, handleSubmit };
}

export type BetFormState = ReturnType<typeof useBetFormState>;
