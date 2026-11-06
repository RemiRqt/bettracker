"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  /** Libellé visible (relié au champ). Sans libellé visible, passer `aria-label`. */
  libelle?: string;
  indice?: string;
  valeur: string;
  /** Reçoit la saisie normalisée : virgule → point, seulement chiffres et un séparateur. */
  surValeur: (v: string) => void;
  /** Texte affiché à droite dans le champ (€, x…). */
  unite?: string;
};

/** Normalise une saisie décimale FR (« 1,85 » → « 1.85 »), garde un seul séparateur. */
export function normaliserDecimal(brut: string): string {
  const s = brut.replace(",", ".").replace(/[^\d.]/g, "");
  const i = s.indexOf(".");
  return i === -1 ? s : s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, "");
}

// Saisie de nombre du kit : champ texte + clavier décimal (pas d'<input type="number"> natif :
// flèches, molette et virgule mal gérées). 16 px mini : pas de zoom iOS.
export function ChampNombre({ libelle, indice, valeur, surValeur, unite, className, id: idExterne, ...reste }: Props) {
  const idAuto = useId();
  const id = idExterne ?? idAuto;
  return (
    <div className="grid gap-2">
      {libelle && (
        <Label htmlFor={id} className="text-sm font-medium">
          {libelle}
        </Label>
      )}
      {indice && <p className="-mt-1 text-sm text-muted-foreground">{indice}</p>}
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={valeur}
          onChange={(e) => surValeur(normaliserDecimal(e.target.value))}
          className={cn("h-11 text-base", unite && "pr-9", className)}
          {...reste}
        />
        {unite && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {unite}
          </span>
        )}
      </div>
    </div>
  );
}
