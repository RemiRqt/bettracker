"use client";

import { useState } from "react";
import { Bouton } from "./Bouton";
import { Popup } from "./Popup";

type Props = {
  ouvert: boolean;
  fermer: () => void;
  titre: string;
  message: string;
  libelleAction: string;
  surConfirmer: () => void | Promise<void>;
};

// Confirmation d'une action irréversible (données supprimées pour de bon). Les suppressions
// ordinaires n'en ont pas : elles sont immédiates, avec « Annuler » dans le toast.
export function Confirmation({ ouvert, fermer, titre, message, libelleAction, surConfirmer }: Props) {
  return (
    <Popup ouvert={ouvert} fermer={fermer} titre={titre}>
      <Corps fermer={fermer} message={message} libelleAction={libelleAction} surConfirmer={surConfirmer} />
    </Popup>
  );
}

/** Monté à chaque ouverture (le contenu de la Popup est démonté à la fermeture). */
function Corps({ fermer, message, libelleAction, surConfirmer }: Omit<Props, "ouvert" | "titre">) {
  const [enCours, setEnCours] = useState(false);
  const confirmer = async () => {
    if (enCours) return;
    setEnCours(true);
    try {
      await surConfirmer();
      fermer(); // bouton laissé désactivé pendant l'animation de fermeture : pas de second envoi
    } catch (e) {
      setEnCours(false);
      throw e;
    }
  };
  return (
    <>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-5 grid gap-2">
        <Bouton variant="destructive" enCours={enCours} onClick={confirmer}>
          {libelleAction}
        </Bouton>
        <Bouton variant="ghost" onClick={fermer}>
          Annuler
        </Bouton>
      </div>
    </>
  );
}
