"use client";

import { useState, useTransition, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, CheckCircle, XCircle, Trash2, ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { validateResult, deleteBet, updateBet } from "@/actions/bets";
import { BET_TYPES } from "@/lib/constants";
import { formatEuros, cn } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/team-logo";
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
  logoMap?: Record<string, string>;
}

type FilterKey = "en_cours" | "gagne" | "perdu";
type SortKey = "date" | "gains" | "mise" | "cote";

const FILTERS: { key: FilterKey; label: string; color: string; activeColor: string }[] = [
  { key: "en_cours", label: "En cours", color: "text-blue-400 border-blue-500/30", activeColor: "bg-blue-500/20" },
  { key: "gagne", label: "Gagné", color: "text-emerald-400 border-emerald-500/30", activeColor: "bg-emerald-500/20" },
  { key: "perdu", label: "Perdu", color: "text-red-400 border-red-500/30", activeColor: "bg-red-500/20" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "gains", label: "Gains" },
  { key: "mise", label: "Mise" },
  { key: "cote", label: "Cote" },
];

export function ParisPage({
  bets,
  existingTeams,
  existingTeamsRaw,
  logoMap = {},
}: ParisPageProps) {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get("filter") as FilterKey) || "en_cours";

  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterKey>(initialFilter);
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  // Edit bet dialog
  const [editBet, setEditBet] = useState<Bet | null>(null);
  const [editOdds, setEditOdds] = useState("");
  const [editStake, setEditStake] = useState("");

  function handleSort(key: SortKey) {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  }

  const counts = useMemo(() => ({
    en_cours: bets.filter((b) => b.result === null).length,
    gagne: bets.filter((b) => b.result === "gagne").length,
    perdu: bets.filter((b) => b.result === "perdu").length,
  }), [bets]);

  const filtered = useMemo(() => {
    return bets.filter((b) => {
      switch (filter) {
        case "en_cours": return b.result === null;
        case "gagne": return b.result === "gagne";
        case "perdu": return b.result === "perdu";
      }
    });
  }, [bets, filter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "date":
          cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case "gains":
          cmp = b.potential_net - a.potential_net;
          break;
        case "mise":
          cmp = b.stake - a.stake;
          break;
        case "cote":
          cmp = b.odds - a.odds;
          break;
      }
      return sortAsc ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortBy, sortAsc]);

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

  function openEdit(bet: Bet) {
    setEditBet(bet);
    setEditOdds(bet.odds.toString());
    setEditStake(bet.stake.toString());
  }

  function handleEditSave() {
    if (!editBet) return;
    const odds = parseFloat(editOdds);
    const stake = parseFloat(editStake);
    if (isNaN(odds) || odds <= 1) return;
    if (isNaN(stake) || stake <= 0) return;
    startTransition(async () => {
      await updateBet(editBet.id, { odds, stake });
      setEditBet(null);
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Paris</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="h-9 w-9 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors"
        >
          <Plus className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Filters 1/3 */}
      <div className="grid grid-cols-3 gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "py-2 rounded-xl text-xs font-semibold transition-colors border",
              filter === f.key
                ? `${f.activeColor} ${f.color}`
                : "bg-transparent text-slate-500 border-slate-700/50 hover:border-slate-600"
            )}
          >
            {f.label}
            <span className="ml-1 opacity-60">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {/* Sorts 1/4 reversible */}
      <div className="grid grid-cols-4 gap-1">
        {SORTS.map((s) => {
          const isActive = sortBy === s.key;
          return (
            <button
              key={s.key}
              onClick={() => handleSort(s.key)}
              className={cn(
                "flex items-center justify-center gap-0.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors border",
                isActive
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-[#1e293b] text-slate-500 border-slate-700 hover:border-slate-600"
              )}
            >
              {s.label}
              {isActive && (
                sortAsc
                  ? <ChevronUp className="h-3 w-3" />
                  : <ChevronDown className="h-3 w-3" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bets list */}
      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">Aucun pari</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((bet) => {
            const typeLabel =
              BET_TYPES[bet.series.bet_type as keyof typeof BET_TYPES] ??
              bet.series.bet_type;

            return (
              <div
                key={bet.id}
                className="bg-[#1e293b] rounded-xl p-3 flex items-center justify-between gap-3"
              >
                {/* Left */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <TeamLogo logoUrl={logoMap[bet.series.subject]} size="sm" className="flex-shrink-0" />
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

                {/* Right */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>
                      <span className="text-white">{formatEuros(bet.stake)}</span>
                    </span>
                    <span>
                      ×<span className="text-white ml-0.5">{bet.odds.toFixed(2)}</span>
                    </span>
                  </div>

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
                          onClick={() => openEdit(bet)}
                          disabled={isPending}
                          className="text-slate-500 hover:text-slate-400 transition-colors disabled:opacity-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bet.id)}
                          disabled={isPending}
                          className="text-slate-500 hover:text-slate-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          bet.result === "gagne"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        )}>
                          {bet.result === "gagne" ? "Gagne" : "Perdu"}
                        </span>
                        <button
                          onClick={() => openEdit(bet)}
                          disabled={isPending}
                          className="text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(bet.id)}
                          disabled={isPending}
                          className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit bet dialog */}
      <Dialog open={editBet !== null} onOpenChange={(open) => { if (!open) setEditBet(null); }}>
        <DialogContent className="bg-[#0f172a] border-slate-700 max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Modifier le pari</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editBet && `${editBet.series.subject} - Pari #${editBet.bet_number}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Cote</label>
              <input
                type="number"
                step="0.01"
                value={editOdds}
                onChange={(e) => setEditOdds(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#10b981]"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Mise</label>
              <input
                type="number"
                step="0.01"
                value={editStake}
                onChange={(e) => setEditStake(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#10b981]"
              />
            </div>
            <button
              onClick={handleEditSave}
              disabled={isPending}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal */}
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
