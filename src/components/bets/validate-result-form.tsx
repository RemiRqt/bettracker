"use client";

import { useTransition } from "react";
import { validateResult } from "@/actions/bets";
import { formatEuros } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ValidateResultFormProps {
  betId: string;
  stake: number;
  potentialNet: number;
}

export function ValidateResultForm({
  betId,
  stake,
  potentialNet,
}: ValidateResultFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleValidate(result: "gagne" | "perdu") {
    startTransition(async () => {
      const res = await validateResult(betId, result);
      if (result === "gagne" && !res?.error) {
        fireConfetti();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Info du pari en attente */}
      <div className="rounded-lg bg-card/60 p-3 md:p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Pari en attente de résultat
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-sm">
          <span className="text-muted-foreground">Mise :</span>
          <span className="font-medium text-secondary-foreground">{formatEuros(stake)}</span>
          <span className="text-muted-foreground">Gain potentiel net :</span>
          <span className="font-medium text-primary">
            {formatEuros(potentialNet)}
          </span>
        </div>
      </div>

      {/* Boutons de validation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={() => handleValidate("gagne")}
          disabled={isPending}
          className="h-12 font-medium text-sm md:text-base"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-5 w-5" />
          )}
          Gagné
        </Button>
        <Button
          variant="outline"
          onClick={() => handleValidate("perdu")}
          disabled={isPending}
          className="h-12 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive font-medium text-sm md:text-base"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-5 w-5" />
          )}
          Perdu
        </Button>
      </div>
    </div>
  );
}
