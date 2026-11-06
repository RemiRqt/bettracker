"use client";

import { useState } from "react";
import { computeStake, round2 } from "@/lib/bet-calc";
import type { BetMode } from "./bet-form-types";

// Montants saisis (cote, mise, gain, objectif) : état brut, remis à zéro au changement de sujet/mode.
export function useBetAmounts() {
  const [targetGain, setTargetGain] = useState(1);
  const [odds, setOdds] = useState("");
  const [stake, setStake] = useState("");
  const [gain, setGain] = useState("");
  const [stakeEdited, setStakeEdited] = useState(false);

  function resetAmounts() {
    setOdds("");
    setStake("");
    setGain("");
    setStakeEdited(false);
  }

  return {
    targetGain,
    setTargetGain,
    odds,
    setOdds,
    stake,
    setStake,
    gain,
    setGain,
    stakeEdited,
    setStakeEdited,
    resetAmounts,
  };
}

type Amounts = ReturnType<typeof useBetAmounts>;

/** Contexte martingale : pari #n, somme des mises S, cible T. */
export interface MartingaleCtx {
  mode: BetMode;
  n: number;
  S: number;
  T: number;
}

// Handlers de calcul (rendu direct, pas de useEffect) : la mise suit la cote tant qu'elle
// n'a pas été modifiée à la main ; en pari unique, mise et gain net se répondent.
export function amountHandlers(a: Amounts, { mode, n, S, T }: MartingaleCtx) {
  const o = parseFloat(a.odds) || 0;
  const validOdds = o > 1;

  function onOddsChange(v: string) {
    a.setOdds(v);
    const c = parseFloat(v) || 0;
    if (mode === "unique") {
      if (c > 1 && a.stake !== "") a.setGain(String(round2((parseFloat(a.stake) || 0) * (c - 1))));
    } else if (!a.stakeEdited && c > 1) {
      a.setStake(String(computeStake(n, T, S, c)));
    }
  }

  function onStakeChange(v: string) {
    a.setStake(v);
    a.setStakeEdited(true);
    if (mode === "unique" && validOdds) a.setGain(String(round2((parseFloat(v) || 0) * (o - 1))));
  }

  function onGainChange(v: string) {
    a.setGain(v);
    if (validOdds) a.setStake(String(round2((parseFloat(v) || 0) / (o - 1))));
  }

  function onObjectiveChange(num: number) {
    a.setTargetGain(num);
    if (!a.stakeEdited && validOdds) a.setStake(String(computeStake(1, num, 0, o)));
  }

  return { o, validOdds, onOddsChange, onStakeChange, onGainChange, onObjectiveChange };
}
