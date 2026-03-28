"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createSeries } from "@/actions/series";
import { Trophy, ThumbsDown, Target, Search, ChevronDown } from "lucide-react";
import { BET_TYPES } from "@/lib/constants";
import type { BetType } from "@/lib/types";

interface SeriesFormProps {
  existingTeams: { subject: string; bet_type: string; lastStatus?: string }[];
  onSuccess?: () => void;
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

const STATUS_DOT_COLORS: Record<string, string> = {
  en_cours: "bg-blue-500",
  abandonnee: "bg-red-500",
  gagnee: "bg-emerald-500",
};

const STATUS_LABELS: Record<string, string> = {
  en_cours: "En cours",
  abandonnee: "Abandonnée",
  gagnee: "Gagnée",
};

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

export function SeriesForm({ existingTeams, onSuccess }: SeriesFormProps) {
  const [state, formAction] = useActionState(createSeriesAction, null);
  const [subject, setSubject] = useState("");
  const [betType, setBetType] = useState<BetType | "">("");
  const [targetGain, setTargetGain] = useState(1.0);
  const [selectedTeamKey, setSelectedTeamKey] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamsOpen, setTeamsOpen] = useState(false);
  const prevStateRef = useRef(state);

  // Detect successful form submission (redirect means state becomes null after being set)
  useEffect(() => {
    // If we had a previous state with no error and now it's null, the redirect happened
    if (prevStateRef.current !== null && state === null && !prevStateRef.current?.error) {
      onSuccess?.();
    }
    prevStateRef.current = state;
  }, [state, onSuccess]);

  function handleTeamSelect(team: {
    subject: string;
    bet_type: string;
    lastStatus?: string;
  }) {
    const key = `${team.subject}::${team.bet_type}`;
    if (selectedTeamKey === key) {
      setSelectedTeamKey(null);
      setSubject("");
      setBetType("");
    } else {
      setSelectedTeamKey(key);
      setSubject(team.subject);
      setBetType(team.bet_type as BetType);
    }
  }

  const filteredTeams = existingTeams.filter((t) =>
    t.subject.toLowerCase().includes(teamSearch.toLowerCase())
  );

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
          <button
            type="button"
            onClick={() => setTeamsOpen(!teamsOpen)}
            className="flex items-center justify-between w-full text-sm font-medium text-slate-300"
          >
            <span>Équipe existante</span>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${
                teamsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {teamsOpen && (
            <div className="space-y-2">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full h-10 rounded-lg bg-[#1e293b] border border-slate-600 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981] transition-colors"
                />
              </div>

              {/* Scrollable list */}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-[#1e293b] divide-y divide-slate-700/50">
                {filteredTeams.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-slate-500">
                    Aucun résultat
                  </div>
                ) : (
                  filteredTeams.map((team) => {
                    const key = `${team.subject}::${team.bet_type}`;
                    const isSelected = selectedTeamKey === key;
                    const typeLabel =
                      BET_TYPES[team.bet_type as keyof typeof BET_TYPES] ??
                      team.bet_type;
                    const statusColor =
                      STATUS_DOT_COLORS[team.lastStatus ?? ""] ?? "bg-slate-500";

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleTeamSelect(team)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? "bg-[#10b981]/10"
                            : "hover:bg-slate-700/50"
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 h-2 w-2 rounded-full ${statusColor}`}
                        />
                        <span
                          className={`text-sm font-medium truncate ${
                            isSelected ? "text-[#10b981]" : "text-white"
                          }`}
                        >
                          {team.subject}
                        </span>
                        <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-400">
                          {typeLabel}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

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

      {/* Target gain slider */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-300">
          Objectif de gain
        </label>
        <input type="hidden" name="target_gain" value={targetGain} />
        <div className="px-1">
          <input
            type="range"
            min={0}
            max={10}
            step={0.25}
            value={targetGain}
            onChange={(e) => setTargetGain(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-[#10b981] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#10b981] [&::-webkit-slider-thumb]:shadow-lg"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>0 €</span>
          <span className="text-lg font-bold text-emerald-400">{targetGain.toFixed(2)} €</span>
          <span>10 €</span>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
