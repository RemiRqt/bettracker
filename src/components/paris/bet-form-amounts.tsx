"use client";

import { useId, useState } from "react";
import { round2, computeStake } from "@/lib/bet-calc";
import { formatEuros } from "@/lib/utils";
import { ChampNombre } from "@/components/kit/ChampNombre";
import { ERREUR_COTE, ERREUR_MISE, type BetFormState } from "./use-bet-form-state";

// Paliers de l'objectif de gain : 0–2 pas 0,05 · 2–5 pas 0,1 · 5–10 pas 0,25.
const OBJECTIVE_STOPS: number[] = [];
for (let i = 0; i <= 40; i++) OBJECTIVE_STOPS.push(round2(i * 0.05)); // 0 → 2
for (let i = 21; i <= 50; i++) OBJECTIVE_STOPS.push(round2(i * 0.1)); // 2,1 → 5
for (let i = 21; i <= 40; i++) OBJECTIVE_STOPS.push(round2(i * 0.25)); // 5,25 → 10

function nearestStopIndex(v: number): number {
  let best = 0;
  for (let i = 1; i < OBJECTIVE_STOPS.length; i++) {
    if (Math.abs(OBJECTIVE_STOPS[i] - v) < Math.abs(OBJECTIVE_STOPS[best] - v)) best = i;
  }
  return best;
}

const CHAMP = "h-12 rounded-xl bg-card px-4";

interface ObjectiveProps {
  targetGain: number;
  onChange: (v: number) => void;
}

// Nouvelle série : objectif (slider à pas variables + saisie libre).
export function ObjectiveSlider({ targetGain, onChange }: ObjectiveProps) {
  const id = useId();
  // Texte saisi gardé à part : « 1, » ou « 1.0 » restent affichés pendant la frappe.
  const [texte, setTexte] = useState(String(targetGain));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-secondary-foreground">
          Objectif de gain
        </label>
        <div className="w-24">
          <ChampNombre
            id={id}
            valeur={texte}
            surValeur={(v) => {
              setTexte(v);
              onChange(parseFloat(v) || 0);
            }}
            className="h-9 rounded-lg bg-card px-3 text-right"
          />
        </div>
      </div>
      <input
        type="range"
        aria-label="Objectif de gain (curseur)"
        aria-valuetext={formatEuros(targetGain)}
        min={0}
        max={OBJECTIVE_STOPS.length - 1}
        step={1}
        value={nearestStopIndex(targetGain)}
        onChange={(e) => {
          const v = OBJECTIVE_STOPS[parseInt(e.target.value, 10)];
          setTexte(String(v));
          onChange(v);
        }}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0 €</span>
        <span className="text-lg font-bold text-primary">{formatEuros(targetGain)}</span>
        <span>10 €</span>
      </div>
    </div>
  );
}

// Cote + mise (série / reprise) ou cote puis mise + gain (unique).
export function BetAmounts({ state }: { state: BetFormState }) {
  const { mode, amounts, calc, error, errorId, n, T, S } = state;
  const oddsInvalid = error === ERREUR_COTE;
  const stakeInvalid = error === ERREUR_MISE;

  const cote = (
    <ChampNombre
      libelle="Cote"
      aria-invalid={oddsInvalid || undefined}
      aria-describedby={oddsInvalid ? errorId : undefined}
      valeur={amounts.odds}
      surValeur={calc.onOddsChange}
      placeholder="Ex : 1.50"
      className={CHAMP}
    />
  );
  const mise = (placeholder: string) => (
    <ChampNombre
      libelle="Mise"
      aria-invalid={stakeInvalid || undefined}
      aria-describedby={stakeInvalid ? errorId : undefined}
      valeur={amounts.stake}
      surValeur={calc.onStakeChange}
      placeholder={placeholder}
      className={CHAMP}
    />
  );

  if (mode === "unique") {
    return (
      <div className="space-y-3">
        {cote}
        <div className="grid grid-cols-2 gap-2">
          {mise("€")}
          <ChampNombre
            libelle="Gain net"
            valeur={amounts.gain}
            surValeur={calc.onGainChange}
            placeholder="€"
            className={CHAMP}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {cote}
        {mise(calc.validOdds ? formatEuros(computeStake(n, T, S, calc.o)) : "€")}
      </div>
      <p className="text-sm text-muted-foreground">
        Gain net : <span className="text-primary font-medium">{formatEuros(state.serieGain)}</span>
      </p>
    </div>
  );
}
