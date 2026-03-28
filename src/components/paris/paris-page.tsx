"use client";

import { useState, useTransition } from "react";
import { Plus, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { validateResult, deleteBet } from "@/actions/bets";
import { BET_TYPES } from "@/lib/constants";
import { formatEuros } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SeriesForm } from "@/components/series/series-form";

interface Series {
  id: string;
  subject: string;
  bet_type: string;
  status: string;
  target_gain: number;
  user_id: string;
}

interface Bet {
  id: string;
  bet_number: number;
  odds: number;
  stake: number;
  potential_net: number;
  result: string | null;
  created_at: string;
  series_id: string;
  series: Series;
}

interface ParisPageProps {
  bets: Bet[];
  existingTeams: { subject: string; bet_type: string; lastStatus: string }[];
  existingTeamsRaw: { subject: string; bet_type: string }[];
}

export function ParisPage({
  bets,
  existingTeams,
  existingTeamsRaw,
}: ParisPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleValidate(betId: string, result: "gagne" | "perdu") {
    startTransition(async () => {
      await validateResult(betId, result);
    });
  }

  function handleDelete(betId: string) {
    if (!confirm("Supprimer ce pari ?")) return;
    startTransition(async () => {
      await deleteBet(betId);
    });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] font-[Poppins,sans-serif]">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Paris</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="h-10 w-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Bets list */}
        {bets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">Aucun pari pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => {
              const typeLabel =
                BET_TYPES[bet.series.bet_type as keyof typeof BET_TYPES] ??
                bet.series.bet_type;

              return (
                <div
                  key={bet.id}
                  className="bg-[#1e293b] rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  {/* Left side */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm truncate">
                        {bet.series.subject}
                      </span>
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
                        {typeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {formatDate(bet.created_at)}
                      </span>
                      <span className="text-xs text-slate-500">
                        Pari #{bet.bet_number}
                      </span>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>
                        Mise:{" "}
                        <span className="text-white">
                          {formatEuros(bet.stake)}
                        </span>
                      </span>
                      <span>
                        Cote:{" "}
                        <span className="text-white">
                          {bet.odds.toFixed(2)}
                        </span>
                      </span>
                    </div>

                    {/* Status or actions */}
                    <div className="mt-1.5 flex items-center justify-end gap-1.5">
                      {bet.result === null ? (
                        <>
                          <button
                            onClick={() => handleValidate(bet.id, "gagne")}
                            disabled={isPending}
                            className="text-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="h-7 w-7" />
                          </button>
                          <button
                            onClick={() => handleValidate(bet.id, "perdu")}
                            disabled={isPending}
                            className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-7 w-7" />
                          </button>
                          <button
                            onClick={() => handleDelete(bet.id)}
                            disabled={isPending}
                            className="text-slate-500 hover:text-slate-400 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-6 w-6" />
                          </button>
                        </>
                      ) : bet.result === "gagne" ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                          Gagné
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                          Perdu
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for creating a new series */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#0f172a] border-slate-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Nouvelle série</DialogTitle>
            <DialogDescription className="text-slate-400">
              Créez une nouvelle série de paris progressifs
            </DialogDescription>
          </DialogHeader>
          <SeriesForm
            existingTeams={existingTeams}
            onSuccess={() => setModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
