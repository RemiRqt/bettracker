"use client";

import { useState } from "react";
import { abandonSeries } from "@/actions/series";
import { Bouton } from "@/components/kit/Bouton";
import { Confirmation } from "@/components/kit/Confirmation";

interface AbandonDialogProps {
  seriesId: string;
}

// Abandon d'une série (fiche série) : irréversible → Confirmation du kit.
export function AbandonDialog({ seriesId }: AbandonDialogProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Bouton variant="destructive" onClick={() => setOuvert(true)}>
        Abandonner la série
      </Bouton>
      <Confirmation
        ouvert={ouvert}
        fermer={() => setOuvert(false)}
        titre="Abandonner cette série ?"
        message="Cette action est irréversible. Tous les paris en attente seront marqués comme perdus."
        libelleAction="Abandonner la série"
        surConfirmer={async () => {
          await abandonSeries(seriesId);
        }}
      />
    </>
  );
}
