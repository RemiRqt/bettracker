"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteSeries } from "@/actions/series";
import { useToast } from "@/hooks/use-toast";
import { Bouton } from "@/components/kit/Bouton";
import { Confirmation } from "@/components/kit/Confirmation";

interface DeleteSeriesButtonProps {
  seriesId: string;
}

// Suppression d'une série vide (fiche série) : irréversible → Confirmation du kit.
export function DeleteSeriesButton({ seriesId }: DeleteSeriesButtonProps) {
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  async function handleDelete() {
    const result = await deleteSeries(seriesId);
    if (result?.error) {
      toast({ title: "Erreur", description: result.error, variant: "destructive" });
      return;
    }
    startTransition(() => router.replace("/series"));
  }

  return (
    <>
      <Bouton variant="destructive" enCours={isPending} onClick={() => setOuvert(true)}>
        {!isPending && <Trash2 data-icon="inline-start" aria-hidden="true" />}
        Supprimer la série
      </Bouton>
      <Confirmation
        ouvert={ouvert}
        fermer={() => setOuvert(false)}
        titre="Supprimer cette série ?"
        message="Cette série ne contient aucun pari. Cette action est irréversible."
        libelleAction="Supprimer la série"
        surConfirmer={handleDelete}
      />
    </>
  );
}
