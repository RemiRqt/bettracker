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
        size="icon"
        aria-label="Ajouter un freebet"
        className="h-9 w-9 rounded-lg bg-warning hover:bg-warning text-foreground cursor-pointer"
      >
        <Plus className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-md mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Nouveau freebet</DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
              className="h-10 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="h-10 rounded-lg bg-warning hover:bg-warning text-foreground font-semibold cursor-pointer"
            >
              Ajouter
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
