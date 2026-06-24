"use client";

import { useState } from "react";
import { placeFreebetBet } from "@/actions/freebets";
import { formatEuros } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircleDollarSign, Plus } from "lucide-react";

interface FreebetBetFormProps {
  totalBalance: number;
}

export function FreebetBetForm({ totalBalance }: FreebetBetFormProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [odds, setOdds] = useState("");
  const [stake, setStake] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const numOdds = parseFloat(odds);
  const numStake = parseFloat(stake);
  const potentialProfit =
    numOdds > 1 && numStake > 0
      ? Math.round((numStake * numOdds - numStake) * 100) / 100
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await placeFreebetBet({
      subject,
      odds: numOdds,
      stake: numStake,
    });

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSubject("");
      setOdds("");
      setStake("");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer">
          <Plus className="mr-1 h-4 w-4" />
          Placer un pari freebet
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1e293b] border border-slate-700 text-white max-w-md mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Placer un pari freebet</DialogTitle>
          <DialogDescription className="text-amber-400">
            Solde : {formatEuros(totalBalance)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Sujet (ex: PSG vs Marseille)"
            required
            className="h-10 rounded-lg bg-[#0f172a] border-slate-600 text-slate-100 placeholder:text-slate-500"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              value={odds}
              onChange={(e) => setOdds(e.target.value)}
              type="number"
              step="0.01"
              min="1.01"
              placeholder="Cote"
              required
              className="h-10 rounded-lg bg-[#0f172a] border-slate-600 text-slate-100 placeholder:text-slate-500"
            />
            <Input
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              type="number"
              step="0.01"
              min="0.01"
              max={totalBalance}
              placeholder={`Mise (max ${formatEuros(totalBalance)})`}
              required
              className="h-10 rounded-lg bg-[#0f172a] border-slate-600 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {potentialProfit > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CircleDollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">
                Gain potentiel : {formatEuros(potentialProfit)}
              </span>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="h-10 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
          >
            Placer le pari
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
