"use client";

import { useState } from "react";
import { addFreebet } from "@/actions/freebets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export function FreebetForm() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("amount", amount);

    const result = await addFreebet(formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setAmount("");
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="h-8 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Ajouter
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Nouveau freebet</DialogTitle>
            <DialogDescription className="text-slate-400">
              Ajoutez un crédit freebet reçu
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Montant (€)"
              required
              className="h-10 rounded-lg bg-[#0f172a] border-slate-600 text-slate-100 placeholder:text-slate-500"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="h-10 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
            >
              Ajouter
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
