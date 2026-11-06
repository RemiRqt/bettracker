"use client";

import { useState } from "react";
import { addTransaction } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Popup } from "@/components/kit/Popup";
import { Bouton } from "@/components/kit/Bouton";
import { ChampNombre } from "@/components/kit/ChampNombre";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransactionForm() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 cursor-pointer"
      >
        <Plus aria-hidden className="mr-1 h-4 w-4" />
        Ajouter une transaction
      </Button>
      <Popup ouvert={open} fermer={() => setOpen(false)} titre="Nouvelle transaction">
        <Formulaire fermer={() => setOpen(false)} />
      </Popup>
    </>
  );
}

const TYPES = [
  { valeur: "depot", libelle: "Dépôt", actif: "bg-primary text-primary-foreground" },
  { valeur: "retrait", libelle: "Retrait", actif: "bg-destructive text-destructive-foreground" },
] as const;

/** Monté à chaque ouverture : le formulaire repart vide. */
function Formulaire({ fermer }: { fermer: () => void }) {
  const [type, setType] = useState<"depot" | "retrait">("depot");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData();
    fd.set("type", type);
    fd.set("amount", amount);
    fd.set("note", note);

    const result = await addTransaction(fd);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    fermer();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Choix segmenté pleine largeur (Retrait en rouge) : gardé plutôt que des Puces. */}
      <div role="group" aria-label="Type de transaction" className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.valeur}
            type="button"
            aria-pressed={type === t.valeur}
            onClick={() => setType(t.valeur)}
            className={cn(
              "flex-1 h-11 rounded-xl text-sm font-medium transition-colors",
              type === t.valeur ? t.actif : "bg-background text-muted-foreground border border-border"
            )}
          >
            {t.libelle}
          </button>
        ))}
      </div>

      <ChampNombre
        valeur={amount}
        surValeur={setAmount}
        unite="€"
        placeholder="Montant"
        aria-label="Montant (€)"
        aria-invalid={error ? true : undefined}
        required
        className="bg-background"
      />

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optionnel)"
        aria-label="Note (optionnel)"
        className="h-11 w-full rounded-lg bg-background border border-border px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
      />

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Bouton type="submit" enCours={loading} className="h-11 rounded-lg font-semibold">
        Ajouter
      </Bouton>
    </form>
  );
}
