"use client";

import { useState } from "react";
import { addTransaction } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransactionForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"depot" | "retrait">("depot");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData();
    fd.set("type", type);
    fd.set("amount", amount);
    fd.set("note", note);

    const result = await addTransaction(fd);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    setAmount("");
    setNote("");
    setType("depot");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 cursor-pointer">
          <Plus className="mr-1 h-4 w-4" />
          Ajouter une transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-border text-foreground max-w-md mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nouvelle transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("depot")}
              className={cn(
                "flex-1 h-10 rounded-xl text-sm font-medium transition-colors",
                type === "depot"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground border border-border"
              )}
            >
              Dépôt
            </button>
            <button
              type="button"
              onClick={() => setType("retrait")}
              className={cn(
                "flex-1 h-10 rounded-xl text-sm font-medium transition-colors",
                type === "retrait"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-background text-muted-foreground border border-border"
              )}
            >
              Retrait
            </button>
          </div>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0.01"
            placeholder="Montant (€)"
            required
            className="h-10 w-full rounded-lg bg-background border border-border px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optionnel)"
            className="h-10 w-full rounded-lg bg-background border border-border px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="h-10 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 cursor-pointer"
          >
            {loading ? "..." : "Ajouter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
