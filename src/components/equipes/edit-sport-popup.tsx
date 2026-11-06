"use client";

import { useId, useState } from "react";
import { Popup } from "@/components/kit/Popup";
import { SPORTS, SPORT_EMOJIS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MergedEquipe } from "./equipe-card";

interface EditSportPopupProps {
  equipe: MergedEquipe | null;
  fermer: () => void;
  surChoix: (equipe: MergedEquipe, sport: string) => Promise<void>;
}

// Popup « Modifier [équipe] » : choix du sport. Garde la dernière équipe affichée pendant
// l'animation de fermeture (le parent remet `equipe` à null).
export function EditSportPopup({ equipe, fermer, surChoix }: EditSportPopupProps) {
  const [derniere, setDerniere] = useState(equipe);
  if (equipe && equipe !== derniere) setDerniere(equipe);
  const affichee = equipe ?? derniere;

  return (
    <Popup ouvert={equipe !== null} fermer={fermer} titre={`Modifier ${affichee?.name ?? ""}`} description="Sport de l'équipe">
      {affichee && <ChoixSport equipe={affichee} surChoix={surChoix} />}
    </Popup>
  );
}

function ChoixSport({ equipe, surChoix }: { equipe: MergedEquipe; surChoix: EditSportPopupProps["surChoix"] }) {
  const sportLabelId = useId();
  return (
    <div>
      <p id={sportLabelId} className="text-xs text-muted-foreground mb-1.5 block">Sport</p>
      <div role="group" aria-labelledby={sportLabelId} className="grid grid-cols-2 gap-2">
        {(Object.entries(SPORTS) as [string, string][]).map(([sKey, sLabel]) => (
          <button
            key={sKey}
            type="button"
            aria-pressed={equipe.sport === sKey}
            onClick={() => surChoix(equipe, sKey)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors border",
              equipe.sport === sKey
                ? "bg-primary/20 text-primary border-primary/30"
                : "bg-background text-muted-foreground border-border hover:border-border/80"
            )}
          >
            <span aria-hidden="true">{SPORT_EMOJIS[sKey]}</span>
            {sLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
