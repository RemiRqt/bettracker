"use client";

import { useCallback, useState } from "react";
import type { ApiTeamAdded, BetFormProps, ExistingSubject, TeamMappingLite } from "./bet-form-types";

type Options = Omit<BetFormProps, "onSuccess"> & { resetAmounts: () => void };

type EtatSujet = {
  sport: string;
  name: string;
  apiTeam: ApiTeamAdded | null;
  selectedSubject: ExistingSubject | null;
  createdNew: boolean;
  betType: string;
  betTypeCustom: string;
  showList: boolean;
  addTeamOpen: boolean;
};
type Maj = (patch: Partial<EtatSujet>) => void;

/** Sujet existant correspondant au préremplissage (même type de pari d'abord). */
function sujetPrerempli({ existingSubjects, lockedSeries, prefill }: Omit<Options, "teamMappings" | "resetAmounts">) {
  if (!prefill || lockedSeries) return null;
  return (
    existingSubjects.find((s) => s.subject === prefill.subject && (!prefill.betType || s.betType === prefill.betType)) ??
    existingSubjects.find((s) => s.subject === prefill.subject) ??
    null
  );
}

function etatInitial(options: Omit<Options, "teamMappings" | "resetAmounts">): EtatSujet {
  const { lockedSeries, prefill } = options;
  const prefillSubject = sujetPrerempli(options);
  return {
    sport: lockedSeries?.sport ?? prefillSubject?.sport ?? prefill?.sport ?? "football",
    name: lockedSeries?.subject ?? prefill?.subject ?? "",
    apiTeam: null,
    selectedSubject: prefillSubject,
    createdNew: !!prefill && !prefillSubject,
    betType: lockedSeries?.betType ?? prefillSubject?.betType ?? prefill?.betType ?? "",
    betTypeCustom: "",
    showList: false,
    addTeamOpen: false,
  };
}

/** Recherche locale : sujets déjà pariés, puis équipes connues non encore pariées. */
function rechercheLocale(name: string, existingSubjects: ExistingSubject[], teamMappings: TeamMappingLite[]) {
  const q = name.trim().toLowerCase();
  const subjectResults = (q ? existingSubjects.filter((s) => s.subject.toLowerCase().includes(q)) : existingSubjects).slice(0, 8);
  const seen = new Set(existingSubjects.map((s) => s.subject));
  const mappingResults = (q ? teamMappings.filter((m) => m.subject.toLowerCase().includes(q)) : teamMappings).filter((m) => !seen.has(m.subject)).slice(0, 6);
  const exactLocal = existingSubjects.some((s) => s.subject.toLowerCase() === q) || teamMappings.some((m) => m.subject.toLowerCase() === q);
  return { subjectResults, mappingResults, showAddTeam: q.length > 0 && !exactLocal };
}

/** Choix dans la liste : sujet déjà parié ou équipe connue. */
function actionsChoix(maj: Maj, resetAmounts: () => void) {
  return {
    pickSubject(s: ExistingSubject) {
      maj({ name: s.subject, selectedSubject: s, createdNew: false, betType: s.betType, sport: s.sport, apiTeam: null, showList: false });
      resetAmounts();
    },
    pickMapping(m: TeamMappingLite) {
      const apiTeam: ApiTeamAdded | null =
        m.apiTeamId != null ? { subject: m.subject, apiTeamId: m.apiTeamId, logoUrl: m.logoUrl ?? "", kind: "club", country: null } : null;
      maj({ name: m.subject, selectedSubject: null, createdNew: true, sport: m.sport, apiTeam, showList: false });
      resetAmounts();
    },
  };
}

/** Saisie libre, création d'un nouveau sujet, ajout d'une équipe via l'API. */
function actionsSaisie(maj: Maj) {
  return {
    onNameChange: (v: string) => maj({ name: v, selectedSubject: null, apiTeam: null, createdNew: false, showList: true }),
    onAddTeam: () => maj({ selectedSubject: null, apiTeam: null, createdNew: true, showList: false }),
    onTeamAdded: (t: ApiTeamAdded) =>
      maj({
        apiTeam: t,
        name: t.subject,
        selectedSubject: null,
        createdNew: true,
        sport: "football",
        showList: false,
        addTeamOpen: false,
      }),
  };
}

// Sujet du pari (équipe / joueur) : recherche locale, sélection, création, lien API, type et sport.
export function useTeamSelection({ existingSubjects, teamMappings, lockedSeries, prefill, resetAmounts }: Options) {
  const [etat, setEtat] = useState(() => etatInitial({ existingSubjects, lockedSeries, prefill }));
  const maj = useCallback<Maj>((patch) => setEtat((e) => ({ ...e, ...patch })), []);

  return {
    ...etat,
    setSport: (sport: string) => maj({ sport }),
    setBetType: (betType: string) => maj({ betType }),
    setBetTypeCustom: (betTypeCustom: string) => maj({ betTypeCustom }),
    openList: () => maj({ showList: true }),
    setAddTeamOpen: (addTeamOpen: boolean) => maj({ addTeamOpen }),
    ...rechercheLocale(etat.name, existingSubjects, teamMappings),
    ...actionsChoix(maj, resetAmounts),
    ...actionsSaisie(maj),
  };
}

export type TeamSelection = ReturnType<typeof useTeamSelection>;
