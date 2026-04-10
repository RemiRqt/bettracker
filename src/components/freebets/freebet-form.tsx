"use client";

import { useActionState } from "react";
import { addFreebet } from "@/actions/freebets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function FreebetForm() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return await addFreebet(formData);
    },
    null
  );

  return (
    <div className="rounded-xl bg-[#1e293b] p-4">
      <h2 className="text-sm font-semibold text-slate-200 mb-3">
        Ajouter un freebet
      </h2>
      <form action={action} className="flex flex-col gap-3">
        <Input
          name="source"
          placeholder="Source (ex: Unibet promo)"
          required
          className="h-10 rounded-lg bg-[#0f172a] border-slate-600 text-slate-100 placeholder:text-slate-500"
        />
        <Input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Montant (€)"
          required
          className="h-10 rounded-lg bg-[#0f172a] border-slate-600 text-slate-100 placeholder:text-slate-500"
        />
        {state?.error && (
          <p className="text-xs text-red-400">{state.error}</p>
        )}
        <Button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </form>
    </div>
  );
}
