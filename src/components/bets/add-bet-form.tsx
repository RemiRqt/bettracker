"use client";

import { useState, useTransition, useRef } from "react";
import { addBet } from "@/actions/bets";
import { formatEuros } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AddBetFormProps {
  seriesId: string;
}

export function AddBetForm({ seriesId }: AddBetFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    stake: number;
    potential_net: number;
    bet_number: number;
  } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const odds = parseFloat(formData.get("odds") as string);

    if (isNaN(odds) || odds <= 1) {
      setError("La cote doit être supérieure à 1.");
      return;
    }

    startTransition(async () => {
      const response = await addBet(seriesId, odds);

      if ("error" in response) {
        setError(response.error as string);
        return;
      }

      setResult({
        stake: response.stake,
        potential_net: response.potential_net,
        bet_number: response.bet_number,
      });

      formRef.current?.reset();
    });
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="odds">Cote du pari</Label>
          <Input
            id="odds"
            name="odds"
            type="number"
            step={0.01}
            min={1.01}
            placeholder="Ex : 1.50"
            required
            disabled={isPending}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calcul en cours...
            </>
          ) : (
            "Ajouter le pari"
          )}
        </Button>
      </form>

      {result && (
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium">
            Pari n°{result.bet_number} ajouté avec succès
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Mise calculée :</span>
            <span className="font-medium">{formatEuros(result.stake)}</span>
            <span className="text-muted-foreground">Gain potentiel net :</span>
            <span className="font-medium text-green-600">
              {formatEuros(result.potential_net)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
