"use client";

import { formatEuros } from "@/lib/utils";
import { TeamLogo } from "@/components/ui/team-logo";
import { AddApiTeamDialog } from "@/components/teams/add-api-team-dialog";
import { Bouton } from "@/components/kit/Bouton";
import { TeamSearch } from "./team-search";
import { FixturePicker } from "./fixture-picker";
import { MarketOdds } from "./market-odds";
import { BetModeSelector, BetTeamParams } from "./bet-form-team-params";
import { BetAmounts, ObjectiveSlider } from "./bet-form-amounts";
import { useBetFormState } from "./use-bet-form-state";
import type { BetFormProps } from "./bet-form-types";

export type { ExistingSubject, TeamMappingLite, LockedSeries } from "./bet-form-types";

const LIBELLE_ENVOI = { resume: "Ajouter le pari", unique: "Créer le pari unique", serie: "Lancer la série" } as const;

export function BetForm(props: BetFormProps) {
  const { lockedSeries } = props;
  const state = useBetFormState(props);
  const { team, mode, error, errorId, isPending, fixtureTeamId } = state;

  return (
    <form onSubmit={state.handleSubmit} className="space-y-5 pt-2">
      {error && (
        <div id={errorId} role="alert" className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 1. Nom (recherche) — seul élément visible tant que rien n'est résolu */}
      {lockedSeries ? (
        <div className="flex items-center gap-2 rounded-xl bg-card/60 border border-border px-4 h-12">
          <TeamLogo logoUrl={undefined} size="sm" />
          <span className="text-foreground font-medium">{lockedSeries.subject}</span>
          <span className="ml-auto text-xs text-muted-foreground">
            Reprise · Pari #{state.n} · objectif {formatEuros(state.T)}
          </span>
        </div>
      ) : (
        <TeamSearch
          name={team.name}
          onNameChange={team.onNameChange}
          apiSelected={!!team.apiTeam}
          showList={team.showList}
          onFocus={team.openList}
          subjectResults={team.subjectResults}
          mappingResults={team.mappingResults}
          showAddTeam={team.showAddTeam}
          onPickSubject={team.pickSubject}
          onPickMapping={team.pickMapping}
          onAddTeam={team.onAddTeam}
        />
      )}

      {state.resolved && (
        <>
          {/* 2. Mode : Série (continuer / nouvelle) ou Pari unique */}
          {!lockedSeries && (
            <BetModeSelector
              modeChoice={state.modeChoice}
              hasActiveSeries={!!state.activeCtx}
              onChoose={state.chooseMode}
            />
          )}

          {/* 2 bis. Nouvelle équipe : type + sport (+ lien API si foot) */}
          {!lockedSeries && !team.selectedSubject && <BetTeamParams team={team} />}

          {fixtureTeamId && (
            <FixturePicker
              key={fixtureTeamId}
              teamId={fixtureTeamId}
              value={state.fixture}
              onChange={state.setFixture}
            />
          )}

          <MarketOdds
            state={state.market}
            outcomeLabel={`${state.subjectName} ${state.effectiveBetType === "defaite" ? "battu" : "vainqueur"}`}
            currentOdds={state.calc.o}
            onPick={(price) => state.calc.onOddsChange(String(price))}
          />

          {/* 3. Nouvelle série : objectif */}
          {mode === "serie" && (
            <ObjectiveSlider targetGain={state.amounts.targetGain} onChange={state.calc.onObjectiveChange} />
          )}

          <BetAmounts state={state} />

          <Bouton type="submit" enCours={isPending} className="w-full h-12 rounded-xl text-base font-semibold">
            {isPending ? "Enregistrement..." : LIBELLE_ENVOI[mode]}
          </Bouton>
        </>
      )}

      <AddApiTeamDialog open={team.addTeamOpen} onOpenChange={team.setAddTeamOpen} onTeamAdded={team.onTeamAdded} />
    </form>
  );
}
