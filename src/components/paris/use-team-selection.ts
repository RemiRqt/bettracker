"use client";

import { useState } from "react";
import type { ApiTeamAdded, BetFormProps, ExistingSubject, TeamMappingLite } from "./bet-form-types";

type Options = Omit<BetFormProps, "onSuccess"> & { resetAmounts: () => void };

// Sujet du pari (équipe / joueur) : recherche locale, sélection, création, lien API, type et sport.
export function useTeamSelection({ existingSubjects, teamMappings, lockedSeries, prefill, resetAmounts }: Options) {
  const prefillSubject =
    prefill && !lockedSeries
      ? existingSubjects.find(
          (s) => s.subject === prefill.subject && (!prefill.betType || s.betType === prefill.betType)
        ) ??
        existingSubjects.find((s) => s.subject === prefill.subject) ??
        null
      : null;

  const [sport, setSport] = useState<string>(
    lockedSeries?.sport ?? prefillSubject?.sport ?? prefill?.sport ?? "football"
  );
  const [name, setName] = useState<string>(lockedSeries?.subject ?? prefill?.subject ?? "");
  const [apiTeam, setApiTeam] = useState<ApiTeamAdded | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<ExistingSubject | null>(prefillSubject);
  const [createdNew, setCreatedNew] = useState<boolean>(!!prefill && !prefillSubject);
  const [betType, setBetType] = useState<string>(
    lockedSeries?.betType ?? prefillSubject?.betType ?? prefill?.betType ?? ""
  );
  const [betTypeCustom, setBetTypeCustom] = useState("");
  const [showList, setShowList] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);

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
        ? { subject: m.subject, apiTeamId: m.apiTeamId, logoUrl: m.logoUrl ?? "", kind: "club", country: null }
        : null
    );
    setShowList(false);
    resetAmounts();
  }

  function onNameChange(v: string) {
    setName(v);
    setSelectedSubject(null);
    setApiTeam(null);
    setCreatedNew(false);
    setShowList(true);
  }

  function onAddTeam() {
    setSelectedSubject(null);
    setApiTeam(null);
    setCreatedNew(true);
    setShowList(false);
  }

  function onTeamAdded(t: ApiTeamAdded) {
    setApiTeam(t);
    setName(t.subject);
    setSelectedSubject(null);
    setCreatedNew(true);
    setSport("football");
    setShowList(false);
    setAddTeamOpen(false);
  }

  return {
    sport,
    setSport,
    name,
    apiTeam,
    selectedSubject,
    createdNew,
    betType,
    setBetType,
    betTypeCustom,
    setBetTypeCustom,
    showList,
    openList: () => setShowList(true),
    addTeamOpen,
    setAddTeamOpen,
    subjectResults,
    mappingResults,
    showAddTeam,
    pickSubject,
    pickMapping,
    onNameChange,
    onAddTeam,
    onTeamAdded,
  };
}

export type TeamSelection = ReturnType<typeof useTeamSelection>;
