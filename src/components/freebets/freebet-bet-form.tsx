"use client";

import { useState } from "react";
import { placeFreebetBet } from "@/actions/freebets";
import { formatEuros } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popup } from "@/components/kit/Popup";
import { Bouton } from "@/components/kit/Bouton";
import { ChampNombre } from "@/components/kit/ChampNombre";
import { CircleDollarSign, Plus } from "lucide-react";

interface FreebetBetFormProps {
  totalBalance: number;
}

export function FreebetBetForm({ totalBalance }: FreebetBetFormProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-11 w-full rounded-xl bg-warning hover:bg-warning/90 text-warning-foreground font-semibold cursor-pointer"
      >
        <Plus className="mr-1 h-4 w-4" />
        Placer un pari freebet
      </Button>
      <Popup
        ouvert={open}
        fermer={() => setOpen(false)}
        titre="Placer un pari freebet"
        description={`Solde : ${formatEuros(totalBalance)}`}
      >
        <Formulaire totalBalance={totalBalance} fermer={() => setOpen(false)} />
      </Popup>
    </>
  );
}

/** Monté à chaque ouverture : le formulaire repart vide. */
function Formulaire({ totalBalance, fermer }: FreebetBetFormProps & { fermer: () => void }) {
  const [subject, setSubject] = useState("");
  const [odds, setOdds] = useState("");
  const [stake, setStake] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const numOdds = parseFloat(odds);
  const numStake = parseFloat(stake);
  const potentialProfit =
    numOdds > 1 && numStake > 0 ? Math.round((numStake * numOdds - numStake) * 100) / 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Contrôles autrefois faits par l'<input type="number"> natif (min / max).
    if (!(numOdds > 1)) return setError("La cote doit être supérieure à 1.");
    if (!(numStake > 0)) return setError("La mise doit être positive.");
    if (numStake > totalBalance) return setError(`La mise ne peut pas dépasser ${formatEuros(totalBalance)}.`);
    setLoading(true);

    const result = await placeFreebetBet({ subject, odds: numOdds, stake: numStake });

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      fermer();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Sujet (ex: PSG vs Marseille)"
        aria-label="Sujet du pari"
        required
        className="h-11 rounded-lg bg-background border-border text-base text-foreground placeholder:text-muted-foreground"
      />

      <div className="grid grid-cols-2 gap-2">
        <ChampNombre
          valeur={odds}
          surValeur={setOdds}
          placeholder="Cote"
          aria-label="Cote"
          required
          className="bg-background"
        />
        <ChampNombre
          valeur={stake}
          surValeur={setStake}
          unite="€"
          placeholder={`Mise (max ${formatEuros(totalBalance)})`}
          aria-label={`Mise (max ${formatEuros(totalBalance)})`}
          aria-invalid={error ? true : undefined}
          required
          className="bg-background"
        />
      </div>

      {potentialProfit > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <CircleDollarSign aria-hidden className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary font-medium">
            Gain potentiel : {formatEuros(potentialProfit)}
          </span>
        </div>
      )}

      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

      <Bouton
        type="submit"
        enCours={loading}
        className="h-11 rounded-lg bg-warning hover:bg-warning/90 text-warning-foreground font-semibold"
      >
        Placer le pari
      </Bouton>
    </form>
  );
}
