"use client";

import { useState, useTransition } from "react";
import { createBetEntry } from "@/actions/bets";
import { BET_TYPES, SPORTS } from "@/lib/constants";
import type { SportType } from "@/lib/types";
import {
  computeStake,
  computePotentialNet,
  stakeFromObjective,
  objectiveFromStake,
} from "@/lib/bet-calc";
import { cn, formatEuros } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/team-logo";
import {
  AddApiTeamDialog,
  type ApiTeamAdded,
} from "@/components/teams/add-api-team-dialog";
import { TeamSearch } from "./team-search";
import { Loader2 } from "lucide-react";

export interface ExistingSubject {
  subject: string;
  betType: string;
  sport: string;
  lastStatus: string;
  logoUrl?: string;
  activeSeries?: {
    id: string;
    targetGain: number;
    betCount: number;
    sumStakes: number;
  };
}

export interface TeamMappingLite {
  subject: string;
  apiTeamId: number | null;
  logoUrl: string | null;
  sport: string;
}

export interface LockedSeries {
  seriesId: string;
  subject: string;
  betType: string;
  sport: string;
  targetGain: number;
  betCount: number;
  sumStakes: number;
}

interface BetFormProps {
  existingSubjects: ExistingSubject[];
  teamMappings: TeamMappingLite[];
  lockedSeries?: LockedSeries;
  onSuccess?: () => void;
}

const BET_TYPE_KEYS = Object.keys(BET_TYPES) as (keyof typeof BET_TYPES)[];

export function BetForm({
  existingSubjects,
  teamMappings,
  lockedSeries,
  onSuccess,
}: BetFormProps) {
  const [sport, setSport] = useState<string>(lockedSeries?.sport ?? "football");
  const [name, setName] = useState<string>(lockedSeries?.subject ?? "");
  const [apiTeam, setApiTeam] = useState<ApiTeamAdded | null>(null);
  const [betType, setBetType] = useState<string>(lockedSeries?.betType ?? "");
  const [betTypeCustom, setBetTypeCustom] = useState("");
  const [modeChoice, setModeChoice] = useState<"serie" | "unique">("serie");
  const [uniqueDriver, setUniqueDriver] = useState<"objective" | "stake">("objective");
  const [targetGain, setTargetGain] = useState(1);
  const [odds, setOdds] = useState("");
  const [stake, setStake] = useState("");
  const [objective, setObjective] = useState("");
  const [showList, setShowList] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const effectiveBetType = betType === "autre" ? betTypeCustom.trim() : betType;

  // Contexte série active pour (subject, betType) -> détermine le mode "resume"
  const activeCtx = lockedSeries
    ? {
        targetGain: lockedSeries.targetGain,
        betCount: lockedSeries.betCount,
        sumStakes: lockedSeries.sumStakes,
      }
    : existingSubjects.find(
        (s) =>
          s.subject === name.trim() &&
          s.betType === betType &&
          s.activeSeries
      )?.activeSeries ?? null;

  const mode: "resume" | "serie" | "unique" = activeCtx ? "resume" : modeChoice;

  // === Calculs live ===
  const o = parseFloat(odds) || 0;
  const validOdds = o > 1;

  const n = mode === "resume" ? activeCtx!.betCount + 1 : 1;
  const S = mode === "resume" ? activeCtx!.sumStakes : 0;
  const T = mode === "resume" ? activeCtx!.targetGain : targetGain;
  const suggestedStake = validOdds ? computeStake(n, T, S, o) : 0;
  const effectiveStake = stake !== "" ? parseFloat(stake) || 0 : suggestedStake;
  const serieGain = validOdds ? computePotentialNet(effectiveStake, o, S) : 0;

  // Pari unique
  const uObjInput = objective !== "" ? parseFloat(objective) || 0 : 0;
  const uStakeInput = stake !== "" ? parseFloat(stake) || 0 : 0;
  const uStake =
    uniqueDriver === "objective"
      ? validOdds
        ? stakeFromObjective(uObjInput, o)
        : 0
      : uStakeInput;
  const uObjective =
    uniqueDriver === "stake"
      ? validOdds
        ? objectiveFromStake(uStakeInput, o)
        : 0
      : uObjInput;

  // === Recherche locale ===
  const q = name.trim().toLowerCase();
  const subjectResults = (q
    ? existingSubjects.filter((s) => s.subject.toLowerCase().includes(q))
    : existingSubjects
  ).slice(0, 8);
  const seen = new Set(existingSubjects.map((s) => s.subject));
  const mappingResults = (q
    ? teamMappings.filter((m) => m.subject.toLowerCase().includes(q))
    : teamMappings
  )
    .filter((m) => !seen.has(m.subject))
    .slice(0, 6);
  const exactLocal =
    existingSubjects.some((s) => s.subject.toLowerCase() === q) ||
    teamMappings.some((m) => m.subject.toLowerCase() === q);
  const showAddTeam = sport === "football" && q.length > 0 && !exactLocal;

  function pickSubject(s: ExistingSubject) {
    setName(s.subject);
    setBetType(s.betType);
    setSport(s.sport);
    setApiTeam(null);
    setShowList(false);
  }

  function pickMapping(m: TeamMappingLite) {
    setName(m.subject);
    setSport(m.sport);
    setApiTeam(
      m.apiTeamId != null
        ? {
            subject: m.subject,
            apiTeamId: m.apiTeamId,
            logoUrl: m.logoUrl ?? "",
            kind: "club",
            country: null,
          }
        : null
    );
    setShowList(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const subject = (apiTeam?.subject ?? lockedSeries?.subject ?? name).trim();
    if (!subject) return setError("Le nom est requis.");
    if (!effectiveBetType) return setError("Choisis un type de pari.");
    if (!validOdds) return setError("La cote doit être supérieure à 1.");
    if (mode === "serie" && targetGain <= 0)
      return setError("Définis un objectif de gain.");
    if (mode === "unique") {
      if (uniqueDriver === "objective" && uObjInput <= 0)
        return setError("Renseigne un objectif de gain.");
      if (uniqueDriver === "stake" && uStakeInput <= 0)
        return setError("Renseigne une mise.");
    }

    const payload = {
      subject,
      betType: effectiveBetType,
      sport: sport as SportType,
      mode,
      odds: o,
      targetGain:
        mode === "serie"
          ? targetGain
          : mode === "unique" && uniqueDriver === "objective"
          ? uObjInput
          : undefined,
      stake:
        mode === "unique"
          ? uniqueDriver === "stake"
            ? uStakeInput
            : undefined
          : stake !== ""
          ? parseFloat(stake) || undefined
          : undefined,
      apiTeam: apiTeam
        ? {
            apiTeamId: apiTeam.apiTeamId,
            crestUrl: apiTeam.logoUrl,
            kind: apiTeam.kind,
            country: apiTeam.country ?? undefined,
          }
        : undefined,
    };

    startTransition(async () => {
      const res = await createBetEntry(payload);
      if (res && "error" in res) {
        setError(res.error ?? "Une erreur est survenue.");
        return;
      }
      onSuccess?.();
    });
  }

  const inputCls =
    "w-full h-12 rounded-xl bg-card border border-border px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Sport */}
      {!lockedSeries && (
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(SPORTS) as [string, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSport(key)}
              className={cn(
                "h-10 rounded-lg text-xs font-medium border transition-colors",
                sport === key
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground hover:text-secondary-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Nom */}
      {lockedSeries ? (
        <div className="flex items-center gap-2 rounded-xl bg-card/60 border border-border px-4 h-12">
          <TeamLogo logoUrl={undefined} size="sm" />
          <span className="text-foreground font-medium">{lockedSeries.subject}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            Reprise · Pari #{n} · objectif {formatEuros(T)}
          </span>
        </div>
      ) : (
        <TeamSearch
          name={name}
          onNameChange={(v) => {
            setName(v);
            setApiTeam(null);
            setShowList(true);
          }}
          apiSelected={!!apiTeam}
          showList={showList}
          onFocus={() => setShowList(true)}
          subjectResults={subjectResults}
          mappingResults={mappingResults}
          showAddTeam={showAddTeam}
          onPickSubject={pickSubject}
          onPickMapping={pickMapping}
          onAddTeam={() => setAddTeamOpen(true)}
        />
      )}

      {/* Type de pari (masqué en reprise verrouillée) */}
      {!lockedSeries && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary-foreground">Type de pari</label>
          <div className="grid grid-cols-4 gap-2">
            {BET_TYPE_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setBetType(key)}
                className={cn(
                  "h-11 rounded-xl border text-sm font-medium transition-colors",
                  betType === key
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-muted-foreground hover:text-secondary-foreground"
                )}
              >
                {BET_TYPES[key]}
              </button>
            ))}
          </div>
          {betType === "autre" && (
            <input
              value={betTypeCustom}
              onChange={(e) => setBetTypeCustom(e.target.value)}
              placeholder="Type personnalisé"
              className={inputCls}
              autoFocus
            />
          )}
        </div>
      )}

      {/* Sélecteur Nouvelle série / Pari unique (si pas de série en cours) */}
      {!activeCtx && (
        <div className="grid grid-cols-2 gap-2">
          {(["serie", "unique"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModeChoice(m)}
              className={cn(
                "h-11 rounded-xl border text-sm font-medium transition-colors",
                modeChoice === m
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-card border-border text-muted-foreground"
              )}
            >
              {m === "serie" ? "Nouvelle série" : "Pari unique"}
            </button>
          ))}
        </div>
      )}

      {/* Objectif (nouvelle série) */}
      {mode === "serie" && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-secondary-foreground">Objectif de gain</label>
          <input
            type="range"
            min={0}
            max={10}
            step={0.25}
            value={targetGain}
            onChange={(e) => setTargetGain(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0 €</span>
            <span className="text-lg font-bold text-primary">{formatEuros(targetGain)}</span>
            <span>10 €</span>
          </div>
        </div>
      )}

      {/* Cote */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-secondary-foreground">Cote</label>
        <input
          type="number"
          step="0.01"
          min="1.01"
          value={odds}
          onChange={(e) => setOdds(e.target.value)}
          placeholder="Ex : 1.50"
          className={inputCls}
          required
        />
      </div>

      {/* Champs selon le mode */}
      {mode === "unique" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(["objective", "stake"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setUniqueDriver(d)}
                className={cn(
                  "h-10 rounded-lg border text-xs font-medium transition-colors",
                  uniqueDriver === d
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-card border-border text-muted-foreground"
                )}
              >
                {d === "objective" ? "Saisir l'objectif" : "Saisir la mise"}
              </button>
            ))}
          </div>
          {uniqueDriver === "objective" ? (
            <>
              <input
                type="number"
                step="0.01"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Objectif de gain (€)"
                className={inputCls}
              />
              <p className="text-sm text-muted-foreground">
                Mise calculée : <span className="text-foreground font-medium">{formatEuros(uStake)}</span>
              </p>
            </>
          ) : (
            <>
              <input
                type="number"
                step="0.01"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Mise (€)"
                className={inputCls}
              />
              <p className="text-sm text-muted-foreground">
                Gain net : <span className="text-primary font-medium">{formatEuros(uObjective)}</span>
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium text-secondary-foreground">Mise</label>
          <input
            type="number"
            step="0.01"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder={validOdds ? formatEuros(suggestedStake) : "Mise (€)"}
            className={inputCls}
          />
          <p className="text-sm text-muted-foreground">
            Mise {stake === "" ? "auto" : ""} :{" "}
            <span className="text-foreground font-medium">{formatEuros(effectiveStake)}</span>
            {"  ·  "}Gain net : <span className="text-primary font-medium">{formatEuros(serieGain)}</span>
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...
          </span>
        ) : mode === "resume" ? (
          "Ajouter le pari"
        ) : mode === "unique" ? (
          "Créer le pari unique"
        ) : (
          "Lancer la série"
        )}
      </button>

      <AddApiTeamDialog
        open={addTeamOpen}
        onOpenChange={setAddTeamOpen}
        onTeamAdded={(t) => {
          setApiTeam(t);
          setName(t.subject);
          setSport("football");
          setShowList(false);
          setAddTeamOpen(false);
        }}
      />
    </form>
  );
}
