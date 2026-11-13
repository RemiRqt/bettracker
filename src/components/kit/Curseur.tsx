"use client";

import { Slider } from "radix-ui";
import { cn } from "@/lib/utils";

type Props = {
  /** Nom lu par le lecteur d'écran (pas de libellé visible). */
  libelle: string;
  valeur: number;
  surValeur: (n: number) => void;
  min?: number;
  max: number;
  pas?: number;
  /** Valeur lue par le lecteur d'écran (« 1,50 € » plutôt que l'index). */
  texteValeur?: string;
  className?: string;
};

// Curseur du kit (Radix Slider dessiné par l'app) : pas d'<input type="range"> natif,
// rendu identique sur tous les navigateurs, poignée de 28 px au doigt.
export function Curseur({ libelle, valeur, surValeur, min = 0, max, pas = 1, texteValeur, className }: Props) {
  return (
    <Slider.Root
      className={cn("relative flex h-7 w-full touch-none items-center select-none", className)}
      value={[valeur]}
      min={min}
      max={max}
      step={pas}
      onValueChange={([n]) => surValeur(n)}
    >
      <Slider.Track className="relative h-2 grow overflow-hidden rounded-full bg-muted">
        <Slider.Range className="absolute h-full rounded-full bg-primary" />
      </Slider.Track>
      <Slider.Thumb
        aria-label={libelle}
        aria-valuetext={texteValeur}
        className="block size-7 cursor-pointer rounded-full border-2 border-primary bg-background shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
      />
    </Slider.Root>
  );
}
