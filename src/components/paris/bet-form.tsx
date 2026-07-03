"use client";

import { useState, useTransition } from "react";
import { createBetEntry } from "@/actions/bets";
import { BET_TYPES, SPORTS } from "@/lib/constants";
import type { SportType } from "@/lib/types";
import { computeStake, computePotentialNet, round2 } from "@/lib/bet-calc";
import { cn, formatEuros } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/team-logo";
import {
  AddApiTeamDialog,
  type ApiTeamAdded,
} from "@/components/teams/add-api-team-dialog";
import { TeamSearch } from "./team-search";
import { Loader2, Link2, Check } from "lucide-react";

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

// Paliers de l'objectif de gain : 0–2 pas 0,05 · 2–5 pas 0,1 · 5–10 pas 0,25.
const OBJECTIVE_STOPS: number[] = [];
for (let i = 0; i <= 40; i++) OBJECTIVE_STOPS.push(round2(i * 0.05)); // 0 → 2
for (let i = 21; i <= 50; i++) OBJECTIVE_STOPS.push(round2(i * 0.1)); // 2,1 → 5
for (let i = 21; i <= 40; i++) OBJECTIVE_STOPS.push(round2(i * 0.25)); // 5,25 → 10

function nearestStopIndex(v: number): number {
  let best = 0;
  for (let i = 1; i < OBJECTIVE_STOPS.length; i++) {
    if (Math.abs(OBJECTIVE_STOPS[i] - v) < Math.abs(OBJECTIVE_STOPS[best] - v)) {
      best = i;
    }
  }
  return best;
}

const BET_TYPE_KEYS = Object.keys(BET_TYPES) as (keyof typeof BET_TYPES)[];

const INPUT =
  "w-full h-12 rounded-xl bg-card border border-border px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

export function BetForm({
  existingSubjects,
  teamMappings,
  lockedSeries,
  onSuccess,
}: BetFormProps) {
  const [sport, setSport] = useState<string>(lockedSeries?.sport ?? "football");
  const [name, setName] = useState<string>(lockedSeries?.subject ?? "");
  const [apiTeam, setApiTeam] = useState<ApiTeamAdded | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<ExistingSubject | null>(null);
  const [createdNew, setCreatedNew] = useState(false);
  const [betType, setBetType] = useState<string>(lockedSeries?.betType ?? "");
  const [betTypeCustom, setBetTypeCustom] = useState("");
  const [modeChoice, setModeChoice] = useState<"serie" | "unique">("serie");
  const [targetGain, setTargetGain] = useState(1);
  const [odds, setOdds] = useState("");
  const [stake, setStake] = useState("");
  const [gain, setGain] = useState("");
  const [stakeEdited, setStakeEdited] = useState(false);
  const [showList, setShowList] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const o = parseFloat(odds) || 0;
  const validOdds = o > 1;

  // Un sujet est résolu (sélection existante, création, ou équipe API) → on déroule le form.
  const resolved =
    !!lockedSeries || !!selectedSubject || !!apiTeam || createdNew;

  const activeCtx = lockedSeries
    ? {
        targetGain: lockedSeries.targetGain,
        betCount: lockedSeries.betCount,
        sumStakes: lockedSeries.sumStakes,
      }
    : selectedSubject?.activeSeries ?? null;

  const mode: "resume" | "serie" | "unique" = lockedSeries
    ? "resume"
    : modeChoice === "unique"
    ? "unique"
    : activeCtx
    ? "resume"
    : "serie";

  const effectiveBetType =
    lockedSeries?.betType ??
    selectedSubject?.betType ??
    (betType === "autre" ? betTypeCustom.trim() : betType);

  // Contexte martingale (resume : pari #n, somme S, cible T ; serie : n=1, S=0, T=slider)
  const n = mode === "resume" ? activeCtx!.betCount + 1 : 1;
  const S = mode === "resume" ? activeCtx!.sumStakes : 0;
  const T = mode === "resume" ? activeCtx!.targetGain : targetGain;
  const serieGain =
    validOdds && stake !== ""
      ? computePotentialNet(parseFloat(stake) || 0, o, S)
      : 0;

  function resetAmounts() {
    setOdds("");
    setStake("");
    setGain("");
    setStakeEdited(false);
  }

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
  const showAddTeam = q.length > 0 && !exactLocal;

  function pickSubject(s: ExistingSubject) {
    setName(s.subject);
    setSelectedSubject(s);
    setCreatedNew(false);
    setBetType(s.betType);
    setSport(s.sport);
    setApiTeam(null);
    setShowList(false);
    resetAmounts();
  }

  function pickMapping(m: TeamMappingLite) {
    setName(m.subject);
    setSelectedSubject(null);
    setCreatedNew(true);
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
    resetAmounts();
  }

  // La section type/sport apparaît pour une équipe "nouvelle" (nom libre ou mapping).
  const needTeamParams = !lockedSeries && !selectedSubject;

  // === Handlers de calcul (rendu direct, pas de useEffect) ===
  function onOddsChange(v: string) {
    setOdds(v);
    const c = parseFloat(v) || 0;
    if (mode === "unique") {
      if (c > 1 && stake !== "")
        setGain(String(round2((parseFloat(stake) || 0) * (c - 1))));
    } else if (!stakeEdited && c > 1) {
      setStake(String(computeStake(n, T, S, c)));
    }
  }

  function onStakeChange(v: string) {
    setStake(v);
    setStakeEdited(true);
    if (mode === "unique" && validOdds)
      setGain(String(round2((parseFloat(v) || 0) * (o - 1))));
  }

  function onGainChange(v: string) {
    setGain(v);
    if (validOdds) setStake(String(round2((parseFloat(v) || 0) / (o - 1))));
  }

  function onObjectiveChange(num: number) {
    setTargetGain(num);
    if (!stakeEdited && validOdds)
      setStake(String(computeStake(1, num, 0, o)));
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
    if ((mode === "unique" || mode === "resume") && stake === "")
      return setError("Renseigne une mise.");

    const payload = {
      subject,
      betType: effectiveBetType,
      sport: sport as SportType,
      mode,
      odds: o,
      targetGain: mode === "serie" ? targetGain : undefined,
      stake: stake !== "" ? parseFloat(stake) || undefined : undefined,
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

  const sliderIndex = nearestStopIndex(targetGain);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 1. Nom (recherche) — seul élément visible tant que rien n'est résolu */}
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
            setSelectedSubject(null);
            setApiTeam(null);
            setCreatedNew(false);
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
          onAddTeam={() => {
            setSelectedSubject(null);
            setApiTeam(null);
            setCreatedNew(true);
            setShowList(false);
          }}
        />
      )}

      {resolved && (
        <>
          {/* 2. Mode : Série (continuer / nouvelle) ou Pari unique */}
          {!lockedSeries && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setModeChoice("serie");
                  resetAmounts();
                }}
                className={cn(
                  "h-11 rounded-xl border text-sm font-medium transition-colors",
                  modeChoice === "serie"
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-card border-border text-muted-foreground"
                )}
              >
                {activeCtx ? "Continuer la série" : "Nouvelle série"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModeChoice("unique");
                  resetAmounts();
                }}
                className={cn(
                  "h-11 rounded-xl border text-sm font-medium transition-colors",
                  modeChoice === "unique"
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-card border-border text-muted-foreground"
                )}
              >
                Pari unique
              </button>
            </div>
          )}

          {/* 2 bis. Nouvelle équipe : type + sport (+ lien API si foot) */}
          {needTeamParams && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-foreground">
                  Type de pari
                </label>
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
                    className={INPUT}
                    autoFocus
                  />
                )}
              </div>

              {apiTeam ? (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Check className="h-4 w-4" /> Lié à {apiTeam.subject}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-foreground">
                    Sport
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(SPORTS) as [string, string][]).map(
                      ([key, label]) => (
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
                      )
                    )}
                  </div>
                  {sport === "football" && (
                    <button
                      type="button"
                      onClick={() => setAddTeamOpen(true)}
                      className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
                    >
                      <Link2 className="h-4 w-4" /> Lier à une équipe API (logo & calendrier)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Nouvelle série : objectif (slider à pas variables + saisie libre) */}
          {mode === "serie" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-secondary-foreground">
                  Objectif de gain
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={targetGain}
                  onChange={(e) => onObjectiveChange(parseFloat(e.target.value) || 0)}
                  className="w-24 h-9 rounded-lg bg-card border border-border px-3 text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <input
                type="range"
                min={0}
                max={OBJECTIVE_STOPS.length - 1}
                step={1}
                value={sliderIndex}
                onChange={(e) =>
                  onObjectiveChange(OBJECTIVE_STOPS[parseInt(e.target.value, 10)])
                }
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>0 €</span>
                <span className="text-lg font-bold text-primary">
                  {formatEuros(targetGain)}
                </span>
                <span>10 €</span>
              </div>
            </div>
          )}

          {/* 3. Cote + mise (série / reprise) ou cote puis mise+gain (unique) */}
          {mode === "unique" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-foreground">
                  Cote
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={odds}
                  onChange={(e) => onOddsChange(e.target.value)}
                  placeholder="Ex : 1.50"
                  className={INPUT}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Mise</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stake}
                    onChange={(e) => onStakeChange(e.target.value)}
                    placeholder="€"
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Gain net</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gain}
                    onChange={(e) => onGainChange(e.target.value)}
                    placeholder="€"
                    className={INPUT}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Cote</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.01"
                    value={odds}
                    onChange={(e) => onOddsChange(e.target.value)}
                    placeholder="Ex : 1.50"
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Mise</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stake}
                    onChange={(e) => onStakeChange(e.target.value)}
                    placeholder={validOdds ? formatEuros(computeStake(n, T, S, o)) : "€"}
                    className={INPUT}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Gain net :{" "}
                <span className="text-primary font-medium">{formatEuros(serieGain)}</span>
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
        </>
      )}

      <AddApiTeamDialog
        open={addTeamOpen}
        onOpenChange={setAddTeamOpen}
        onTeamAdded={(t) => {
          setApiTeam(t);
          setName(t.subject);
          setSelectedSubject(null);
          setCreatedNew(true);
          setSport("football");
          setShowList(false);
          setAddTeamOpen(false);
        }}
      />
    </form>
  );
}
