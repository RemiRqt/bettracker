"use client";

import { ArrowUpCircle, ArrowDownCircle, X } from "lucide-react";
import { deleteTransaction } from "@/actions/transactions";
import { useState } from "react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  created_at: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-4">
        Aucune transaction
      </p>
    );
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id);
    setConfirmId(null);
  }

  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-lg bg-[#0f172a] p-3"
        >
          {/* Icon */}
          {t.type === "depot" ? (
            <ArrowUpCircle className="h-5 w-5 text-[#10b981] shrink-0" />
          ) : (
            <ArrowDownCircle className="h-5 w-5 text-red-400 shrink-0" />
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-sm font-semibold ${
                  t.type === "depot" ? "text-[#10b981]" : "text-red-400"
                }`}
              >
                {t.type === "depot" ? "+" : "-"}
                {t.amount.toFixed(2)} €
              </span>
              <span className="text-xs text-slate-500">
                {formatDate(t.created_at)}
              </span>
            </div>
            {t.note && (
              <p className="text-xs text-slate-500 truncate">{t.note}</p>
            )}
          </div>

          {/* Delete */}
          {confirmId === t.id ? (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleDelete(t.id)}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
              >
                Oui
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="text-xs text-slate-400 hover:text-slate-300 px-2 py-1"
              >
                Non
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmId(t.id)}
              className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
