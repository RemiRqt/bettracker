"use client";

import { useEffect, useState } from "react";
import { getMarketOdds, type MarketOddsResult } from "@/actions/odds";
import type { PickedFixture } from "./fixture-picker";

export type MarketOddsState =
  { status: "idle" } | { status: "loading" } | { status: "unavailable" } | { status: "ready"; data: Exclude<MarketOddsResult, null | { unavailable: true }> };

/**
 * Charge les cotes du marché quand le match ou le type de pari change.
 * `onReady(best)` sert au préremplissage du champ Cote.
 */
export function useMarketOdds(fixture: PickedFixture | null, teamId: number | null, betType: string, onReady: (best: number) => void): MarketOddsState {
  // Réponse rangée avec la clé de sa requête : tant que la clé courante n'a pas de réponse, on charge.
  const [reponse, setReponse] = useState<{ cle: string; state: MarketOddsState } | null>(null);
  const covered = !!fixture?.competitionCode && !!teamId && (betType === "victoire" || betType === "defaite");
  const cle = covered ? `${fixture?.id}|${teamId}|${betType}` : null;

  useEffect(() => {
    if (!cle || !fixture || !teamId) return;
    let cancelled = false;
    const setState = (state: MarketOddsState) => setReponse({ cle, state });
    void getMarketOdds({
      competitionCode: fixture.competitionCode,
      kickoff: fixture.kickoff,
      teamId,
      homeTeamId: fixture.homeTeamId,
      homeNames: fixture.homeNames,
      awayNames: fixture.awayNames,
      betType,
    })
      .catch(() => ({ unavailable: true as const }))
      .then((res) => {
        if (cancelled) return;
        if (res === null) setState({ status: "idle" });
        else if ("unavailable" in res) setState({ status: "unavailable" });
        else {
          setState({ status: "ready", data: res });
          onReady(res.best);
        }
      });
    return () => {
      cancelled = true;
    };
    // onReady volontairement hors deps : préremplissage une fois par chargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  if (!cle) return { status: "idle" };
  return reponse?.cle === cle ? reponse.state : { status: "loading" };
}
