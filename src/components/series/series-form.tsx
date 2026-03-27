"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createSeries } from "@/actions/series";
import { Trophy, ThumbsDown, Target } from "lucide-react";
import type { BetType } from "@/lib/types";

interface SeriesFormProps {
  existingTeams: { subject: string; bet_type: string }[];
}

const BET_TYPE_OPTIONS: {
  value: BetType;
  label: string;
  icon: typeof Trophy;
}[] = [
  { value: "victoire", label: "Victoire", icon: Trophy },
  { value: "defaite", label: "Défaite", icon: ThumbsDown },
  { value: "buteur", label: "Buteur", icon: Target },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-12 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Création en cours..." : "Lancer la série"}
    </button>
  );
}

async function createSeriesAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const result = await createSeries(formData);
  return result ?? null;
}

export function SeriesForm({ existingTeams }: SeriesFormProps) {
  const [state, formAction] = useActionState(createSeriesAction, null);
  const [subject, setSubject] = useState("");
  const [betType, setBetType] = useState<BetType | "">("");
  const [selectedTeamKey, setSelectedTeamKey] = useState<string | null>(null);

  function handleTeamSelect(team: { subject: string; bet_type: string }) {
    const key = `${team.subject}::${team.bet_type}`;
    if (selectedTeamKey === key) {
      // Deselect
      setSelectedTeamKey(null);
      setSubject("");
      setBetType("");
    } else {
      setSelectedTeamKey(key);
      setSubject(team.subject);
      setBetType(team.bet_type as BetType);
    }
  }

  return (
    <form action={formAction} className="space-y-6 pt-4">
      {state?.error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <p className="text-sm text-red-400">{state.error}</p>
        </div>
      )}

      {/* Existing teams section */}
      {existingTeams.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">
            Équipe existante
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {existingTeams.map((team) => {
              const key = `${team.subject}::${team.bet_type}`;
              const isSelected = selectedTeamKey === key;
              const typeLabel = BET_TYPE_OPTIONS.find(
                (o) => o.value === team.bet_type
              )?.label;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTeamSelect(team)}
                  className={`flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors border ${
                    isSelected
                      ? "bg-[#10b981]/20 border-[#10b981] text-[#10b981]"
                      : "bg-[#1e293b] border-slate-600 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {team.subject}
                  {typeLabel && (
                    <span className="ml-1.5 text-xs opacity-70">
                      · {typeLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500">ou créer une nouvelle</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>
        </div>
      )}

      {/* Subject input */}
      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium text-slate-300">
          Sujet
        </label>
        <input
          id="subject"
          name="subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (selectedTeamKey) setSelectedTeamKey(null);
          }}
          placeholder="Ex : PSG, Marseille, Mbappé..."
          required
          className={`w-full h-12 rounded-xl bg-[#1e293b] border border-slate-600 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981] transition-colors ${
            selectedTeamKey ? "opacity-70" : ""
          }`}
        />
      </div>

      {/* Bet type toggles */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">
          Type de pari
        </label>
        <input type="hidden" name="bet_type" value={betType} />
        <div className="grid grid-cols-3 gap-2">
          {BET_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const isSelected = betType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setBetType(value);
                  if (selectedTeamKey) setSelectedTeamKey(null);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-xl border text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-[#10b981] border-[#10b981] text-white"
                    : "bg-[#1e293b] border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target gain input */}
      <div className="space-y-2">
        <label
          htmlFor="target_gain"
          className="text-sm font-medium text-slate-300"
        >
          Objectif de gain (€)
        </label>
        <input
          id="target_gain"
          name="target_gain"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="10.00"
          required
          className="w-full h-12 rounded-xl bg-[#1e293b] border border-slate-600 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981] transition-colors"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
