"use client";

import { Bouton } from "@/components/kit/Bouton";
import { Confirmation } from "@/components/kit/Confirmation";
import { Popup } from "@/components/kit/Popup";

export type DialogueSerie = "supprimer" | "abandonner" | "rouvrir" | null;

interface SeriesItemDialogsProps {
  seriesNumber: number;
  dialogue: DialogueSerie;
  fermer: () => void;
  surSupprimer: () => void;
  surAbandonner: () => void;
  surRouvrir: () => void;
}

// Popups d'une série (liste Équipes) : suppression et abandon (irréversibles → Confirmation),
// réouverture (action douce → Popup avec bouton principal).
export function SeriesItemDialogs({ seriesNumber, dialogue, fermer, surSupprimer, surAbandonner, surRouvrir }: SeriesItemDialogsProps) {
  return (
    <>
      <Confirmation
        ouvert={dialogue === "supprimer"}
        fermer={fermer}
        titre={`Supprimer la série #${seriesNumber} ?`}
        message="Cette action est irréversible."
        libelleAction="Supprimer"
        surConfirmer={surSupprimer}
      />
      <Confirmation
        ouvert={dialogue === "abandonner"}
        fermer={fermer}
        titre={`Abandonner la série #${seriesNumber} ?`}
        message="Les paris en attente seront marqués comme perdus."
        libelleAction="Abandonner"
        surConfirmer={surAbandonner}
      />
      <Popup ouvert={dialogue === "rouvrir"} fermer={fermer} titre={`Rouvrir la série #${seriesNumber} ?`}>
        <p className="text-sm text-muted-foreground">La série repasse en cours ; tu pourras ajouter le pari suivant.</p>
        <div className="mt-5 grid gap-2">
          <Bouton
            onClick={() => {
              surRouvrir();
              fermer();
            }}
          >
            Rouvrir
          </Bouton>
          <Bouton variant="ghost" onClick={fermer}>
            Annuler
          </Bouton>
        </div>
      </Popup>
    </>
  );
}
