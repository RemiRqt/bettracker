"use client";

import { useState } from "react";
import { deleteFreebet } from "@/actions/freebets";
import { formatEuros } from "@/lib/utils";
import type { Freebet } from "@/lib/types";
import { Ticket, Trash2 } from "lucide-react";

interface FreebetListProps {
  freebets: Freebet[];
}

export function FreebetList({ freebets }: FreebetListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteFreebet(id);
    setDeletingId(null);
    setConfirmId(null);
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-200">Mes freebets</h2>
      {freebets.map((fb) => {
        const usedPercent =
          fb.initial_amount > 0
            ? ((fb.initial_amount - fb.remaining_amount) / fb.initial_amount) * 100
            : 0;

        return (
          <div key={fb.id} className="rounded-xl bg-[#1e293b] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">
                  {formatEuros(fb.remaining_amount)}
                </span>
                <span className="text-xs text-slate-500">
                  / {formatEuros(fb.initial_amount)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {confirmId === fb.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(fb.id)}
                      disabled={deletingId === fb.id}
                      className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs text-slate-400 hover:text-slate-300 cursor-pointer"
                    >
                      Non
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(fb.id)}
                    className="text-slate-500 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-500">
                {new Date(fb.created_at).toLocaleDateString("fr-FR")}
              </span>
              <span className="text-[10px] text-slate-500">
                {Math.round(usedPercent)}% utilisé
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
