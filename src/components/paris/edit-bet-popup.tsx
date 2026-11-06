"use client";

import { useState } from "react";
import { Popup } from "@/components/kit/Popup";
import { ChampNombre } from "@/components/kit/ChampNombre";
import { Bouton } from "@/components/kit/Bouton";
import type { Bet } from "./paris-types";

interface EditBetPopupProps {
  bet: Bet | null;
  fermer: () => void;
  enCours: boolean;
  onSave: (bet: Bet, values: { odds: number; stake: number }) => void;
}

function EditBetForm({ bet, enCours, onSave }: { bet: Bet } & Pick<EditBetPopupProps, "enCours" | "onSave">) {
  // Le contenu de la Popup est démonté à la fermeture : chaque ouverture repart des valeurs du pari.
  const [odds, setOdds] = useState(bet.odds.toString());
  const [stake, setStake] = useState(bet.stake.toString());

  function save() {
    const o = parseFloat(odds);
    const s = parseFloat(stake);
    if (isNaN(o) || o <= 1) return;
    if (isNaN(s) || s <= 0) return;
    onSave(bet, { odds: o, stake: s });
  }

  return (
    <div className="space-y-3">
      <ChampNombre libelle="Cote" valeur={odds} surValeur={setOdds} className="rounded-xl bg-card" />
      <ChampNombre libelle="Mise" valeur={stake} surValeur={setStake} unite="€" className="rounded-xl bg-card" />
      <Bouton onClick={save} enCours={enCours} className="w-full h-11 rounded-xl font-semibold">
        Enregistrer
      </Bouton>
    </div>
  );
}

// Modification de la cote et de la mise d'un pari.
export function EditBetPopup({ bet, fermer, enCours, onSave }: EditBetPopupProps) {
  // Garde le dernier pari affiché pendant l'animation de fermeture.
  const [affiche, setAffiche] = useState(bet);
  if (bet && bet !== affiche) setAffiche(bet);

  return (
    <Popup
      ouvert={bet !== null}
      fermer={fermer}
      titre="Modifier le pari"
      description={affiche ? `${affiche.series.subject} - Pari #${affiche.bet_number}` : undefined}
    >
      {affiche && <EditBetForm key={affiche.id} bet={affiche} enCours={enCours} onSave={onSave} />}
    </Popup>
  );
}
