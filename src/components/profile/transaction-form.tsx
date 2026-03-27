"use client";

import { useActionState, useState } from "react";
import { addTransaction } from "@/actions/transactions";

async function transactionAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const result = await addTransaction(formData);
  return result ?? null;
}

export function TransactionForm() {
  const [type, setType] = useState<"depot" | "retrait">("depot");
  const [state, formAction, pending] = useActionState(transactionAction, null);

  return (
    <div className="rounded-xl bg-[#1e293b] p-4 md:p-6">
      <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-4">
        Nouvelle transaction
      </h2>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="type" value={type} />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType("depot")}
            className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${
              type === "depot"
                ? "bg-[#10b981] text-white"
                : "bg-[#0f172a] text-slate-400 border border-slate-600"
            }`}
          >
            Dépôt
          </button>
          <button
            type="button"
            onClick={() => setType("retrait")}
            className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${
              type === "retrait"
                ? "bg-red-500 text-white"
                : "bg-[#0f172a] text-slate-400 border border-slate-600"
            }`}
          >
            Retrait
          </button>
        </div>

        <input
          type="number"
          name="amount"
          step="0.01"
          min="0.01"
          placeholder="Montant (€)"
          required
          className="w-full h-12 rounded-xl bg-[#0f172a] border border-slate-600 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#10b981]"
        />

        <input
          type="text"
          name="note"
          placeholder="Note (optionnel)"
          className="w-full h-12 rounded-xl bg-[#0f172a] border border-slate-600 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#10b981]"
        />

        {state?.error && (
          <p className="text-sm text-red-400">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full h-12 rounded-xl bg-[#10b981] text-white font-medium hover:bg-[#059669] transition-colors disabled:opacity-50"
        >
          {pending ? "..." : "Ajouter"}
        </button>
      </form>
    </div>
  );
}
