"use client";

import { useTransition } from "react";
import { abandonSeries } from "@/actions/series";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface AbandonDialogProps {
  seriesId: string;
}

export function AbandonDialog({ seriesId }: AbandonDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleAbandon() {
    startTransition(async () => {
      await abandonSeries(seriesId);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Abandonner la serie</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Abandonner cette serie ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irreversible. Tous les paris en attente seront
            marques comme perdus.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleAbandon} disabled={isPending}>
            {isPending ? "Abandon en cours..." : "Confirmer l'abandon"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
