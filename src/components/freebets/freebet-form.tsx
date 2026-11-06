"use client";

import { useState } from "react";
import { addFreebet } from "@/actions/freebets";
import { Button } from "@/components/ui/button";
import { Popup } from "@/components/kit/Popup";
import { Bouton } from "@/components/kit/Bouton";
import { ChampNombre } from "@/components/kit/ChampNombre";
import { Plus } from "lucide-react";

export function FreebetForm() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        aria-label="Ajouter un freebet"
        className="h-9 w-9 rounded-lg bg-warning hover:bg-warning/90 text-warning-foreground cursor-pointer"
      >
        <Plus className="h-5 w-5" />
      </Button>

      <Popup
        ouvert={open}
        fermer={() => setOpen(false)}
        titre="Nouveau freebet"
        description="Ajoutez un crédit freebet reçu"
      >
        <Formulaire fermer={() => setOpen(false)} />
      </Popup>
    </>
  );
}

/** Monté à chaque ouverture : le montant repart vide. */
function Formulaire({ fermer }: { fermer: () => void }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("amount", amount);

    const result = await addFreebet(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      fermer();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <ChampNombre
        valeur={amount}
        surValeur={setAmount}
        unite="€"
        placeholder="Montant"
        aria-label="Montant du freebet (€)"
        aria-invalid={error ? true : undefined}
        required
        className="bg-background"
      />
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <Bouton
        type="submit"
        enCours={loading}
        className="h-11 rounded-lg bg-warning hover:bg-warning/90 text-warning-foreground font-semibold"
      >
        Ajouter
      </Bouton>
    </form>
  );
}
