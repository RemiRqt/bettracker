"use client";

import { useState } from "react";
import { placeFreebetBet } from "@/actions/freebets";
import { formatEuros } from "@/lib/utils";
import type { Freebet } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleDollarSign } from "lucide-react";

interface FreebetBetFormProps {
  freebets: Freebet[];
}

export function FreebetBetForm({ freebets }: FreebetBetFormProps) {
  const [selectedId, setSelectedId] = useState(freebets[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [odds, setOdds] = useState("");
  const [stake, setStake] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = freebets.find((f) => f.id === selectedId);
  const maxStake = selected?.remaining_amount ?? 0;
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
      freebetId: selectedId,
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
    }
  }

  return (
    <div className="rounded-xl bg-[#1e293b] p-4">
      <h2 className="text-sm font-semibold text-slate-200 mb-3">
        Placer un pari freebet
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="h-10 rounded-lg bg-[#0f172a] border border-slate-600 text-slate-100 px-3 text-sm"
        >
          {freebets.map((f) => (
            <option key={f.id} value={f.id}>
              {f.source} — {formatEuros(f.remaining_amount)} dispo
            </option>
          ))}
        </select>

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
            max={maxStake}
            placeholder={`Mise (max ${formatEuros(maxStake)})`}
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
    </div>
  );
}
