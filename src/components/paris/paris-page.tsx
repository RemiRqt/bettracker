"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Inbox } from "lucide-react";
import { validateResult, deleteBet, updateBet } from "@/actions/bet-results";
import { fireConfetti } from "@/lib/confetti";
import { useBetModal } from "@/components/paris/bet-modal-provider";
import { ParisEquipesSwitch } from "@/components/paris/paris-equipes-switch";
import { ParisFiltres, ParisTri, useParisTri } from "./paris-filters";
import { BetCard } from "./bet-card";
import { EditBetPopup } from "./edit-bet-popup";
import { WinDialog } from "./win-dialog";
import { Bouton } from "@/components/kit/Bouton";
import { Confirmation } from "@/components/kit/Confirmation";

/** Paris affichés par paquet : la liste complète reste triée/filtrée, le rendu est progressif. */
const PAQUET = 30;
import type { Bet, FilterKey } from "./paris-types";

interface ParisPageProps {
  bets: Bet[];
  logoMap?: Record<string, string>;
}

export function ParisPage({ bets, logoMap = {} }: ParisPageProps) {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as FilterKey) || null;
  const { open: openBetModal } = useBetModal();
  const tri = useParisTri(bets, initialFilter);
  // Revient au premier paquet quand le filtre ou le tri change.
  const triKey = `${tri.filter}-${tri.sortBy}-${tri.sortAsc}`;
  const [affiches, setAffiches] = useState({ key: triKey, n: PAQUET });
  const n = affiches.key === triKey ? affiches.n : PAQUET;

  const [isPending, startTransition] = useTransition();
  const [editBet, setEditBet] = useState<Bet | null>(null);
  const [winBet, setWinBet] = useState<Bet | null>(null);
  // Pari à supprimer : gardé pendant l'animation de fermeture de la Confirmation.
  const [suppression, setSuppression] = useState<{ ouvert: boolean; betId: string | null }>({
    ouvert: false,
    betId: null,
  });

  function handleValidate(betId: string, result: "gagne" | "perdu") {
    startTransition(async () => {
      const res = await validateResult(betId, result);
      if (result === "gagne" && !res?.error) {
        fireConfetti();
      }
    });
  }

  function handleWin(bet: Bet) {
    startTransition(async () => {
      const res = await validateResult(bet.id, "gagne");
      if (!res?.error) {
        fireConfetti();
        setWinBet(bet);
      }
    });
  }

  function handleDelete() {
    const betId = suppression.betId;
    if (!betId) return;
    startTransition(async () => {
      await deleteBet(betId);
    });
  }

  function handleEditSave(bet: Bet, values: { odds: number; stake: number }) {
    startTransition(async () => {
      await updateBet(bet.id, values);
      setEditBet(null);
    });
  }

  return (
    <div className="space-y-3">
      <h1 className="sr-only">Mes paris</h1>
      <ParisEquipesSwitch active="paris" />

      <ParisFiltres tri={tri} />
      <ParisTri tri={tri} />

      {tri.sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm">Aucun pari{tri.filter ? " pour ce filtre" : ""}.</p>
          {!tri.filter && (
            <button type="button" onClick={() => openBetModal()} className="mt-3 text-sm text-primary transition-colors hover:text-primary/80">
              Créer un pari
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {tri.sorted.slice(0, n).map((bet) => (
            <BetCard
              key={bet.id}
              bet={bet}
              logoUrl={logoMap[bet.series.subject]}
              disabled={isPending}
              onEdit={() => setEditBet(bet)}
              onDelete={() => setSuppression({ ouvert: true, betId: bet.id })}
              onWin={() => handleWin(bet)}
              onLose={() => handleValidate(bet.id, "perdu")}
            />
          ))}
          {tri.sorted.length > n && (
            <Bouton variant="outline" className="h-11 w-full" onClick={() => setAffiches({ key: triKey, n: n + PAQUET })}>
              Voir plus ({tri.sorted.length - n})
            </Bouton>
          )}
        </div>
      )}

      <Confirmation
        ouvert={suppression.ouvert}
        fermer={() => setSuppression((s) => ({ ...s, ouvert: false }))}
        titre="Supprimer ce pari ?"
        message="Cette action est irréversible."
        libelleAction="Supprimer"
        surConfirmer={handleDelete}
      />
      <WinDialog bet={winBet} fermer={() => setWinBet(null)} />
      <EditBetPopup bet={editBet} fermer={() => setEditBet(null)} enCours={isPending} onSave={handleEditSave} />
    </div>
  );
}
