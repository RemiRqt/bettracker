"use client";

import { useTransition } from "react";
import { validateResult } from "@/actions/bets";
import { formatEuros } from "@/lib/utils";
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
      await validateResult(betId, result);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <span className="text-muted-foreground">Mise :</span>
        <span className="font-medium">{formatEuros(stake)}</span>
        <span className="text-muted-foreground">Gain potentiel net :</span>
        <span className="font-medium text-green-600">
          {formatEuros(potentialNet)}
        </span>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => handleValidate("gagne")}
          disabled={isPending}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Gagné
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleValidate("perdu")}
          disabled={isPending}
          className="flex-1"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          Perdu
        </Button>
      </div>
    </div>
  );
}
