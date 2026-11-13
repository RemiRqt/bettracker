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
    return <p className="py-4 text-center text-sm text-muted-foreground">Aucune transaction</p>;
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
        <div key={t.id} className="flex items-center gap-3 rounded-lg bg-background p-3">
          {/* Icon */}
          {t.type === "depot" ? <ArrowUpCircle className="h-5 w-5 shrink-0 text-primary" /> : <ArrowDownCircle className="h-5 w-5 shrink-0 text-destructive" />}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-sm font-semibold ${t.type === "depot" ? "text-primary" : "text-destructive"}`}>
                {t.type === "depot" ? "+" : "-"}
                {t.amount.toFixed(2)} €
              </span>
              <span className="text-xs text-muted-foreground">{formatDate(t.created_at)}</span>
            </div>
            {t.note && <p className="truncate text-xs text-muted-foreground">{t.note}</p>}
          </div>

          {/* Delete */}
          {confirmId === t.id ? (
            <div className="flex shrink-0 items-center gap-1">
              <button onClick={() => handleDelete(t.id)} className="px-2 py-1 text-xs text-destructive hover:text-destructive/80">
                Oui
              </button>
              <button onClick={() => setConfirmId(null)} className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                Non
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmId(t.id)}
              aria-label="Supprimer cette transaction"
              className="relative shrink-0 text-muted-foreground transition-colors before:absolute before:-inset-3 before:content-[''] hover:text-destructive"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
