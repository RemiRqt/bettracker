"use client";

import { useState, useTransition, useCallback, useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toggleFollow, deleteTeamMapping } from "@/actions/teams";
import { linkSubject, unlinkSubject, getSubjectLinks } from "@/actions/subject-links";
import type { TeamMapping, SubjectLink } from "@/actions/teams";
import type { ApiTeamAdded } from "@/components/teams/add-api-team-dialog";

/** Ligne locale créée après l'ajout d'une équipe via l'API (avant revalidation serveur). */
function nouveauClub(t: ApiTeamAdded): TeamMapping {
  const maintenant = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    user_id: "",
    subject: t.subject,
    sport: "football",
    api_team_id: t.apiTeamId,
    logo_url: t.logoUrl,
    is_club: true,
    kind: t.kind,
    country: t.country,
    provider: "football-data",
    is_followed: false,
    next_matches_count: 2,
    cached_fixtures: null,
    fixtures_updated_at: null,
    created_at: maintenant,
    updated_at: maintenant,
  };
}

/** Clubs = is_club, favoris d'abord puis ordre alphabétique. */
function trierClubs(mappings: TeamMapping[]) {
  return mappings
    .filter((m) => m.is_club)
    .sort((a, b) => {
      if (a.is_followed !== b.is_followed) return a.is_followed ? -1 : 1;
      return a.subject.localeCompare(b.subject);
    });
}

// Liens N:N sujet ↔ club (subject_links), chargés au montage, modifiés en optimiste.
function useSubjectLinks() {
  const [subjectLinks, setSubjectLinks] = useState<SubjectLink[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getSubjectLinks()
      .then(setSubjectLinks)
      .catch(() => {});
  }, []);

  const link = useCallback((subjectName: string, club: TeamMapping) => {
    const optimisticLink: SubjectLink = {
      id: crypto.randomUUID(),
      subject: subjectName,
      team_mapping_id: club.id,
      created_at: new Date().toISOString(),
    };
    setSubjectLinks((prev) => [...prev, optimisticLink]);
    startTransition(async () => {
      const result = await linkSubject(subjectName, club.id);
      if (result && "error" in result) {
        setSubjectLinks((prev) => prev.filter((l) => l.id !== optimisticLink.id));
      }
    });
  }, []);

  const unlink = useCallback((subjectName: string, clubId: string) => {
    setSubjectLinks((prev) => prev.filter((l) => !(l.subject === subjectName && l.team_mapping_id === clubId)));
    startTransition(async () => {
      await unlinkSubject(subjectName, clubId);
    });
  }, []);

  return { subjectLinks, setSubjectLinks, link, unlink };
}

// Équipes (clubs, nationales, sujets libres) : favori en optimiste, ajout local après l'API.
function useMappings(initialMappings: TeamMapping[]) {
  const [mappings, setMappings] = useState(initialMappings);
  const [, startTransition] = useTransition();

  const toggleFollowClub = useCallback(
    (clubId: string) => {
      const club = mappings.find((m) => m.id === clubId);
      if (!club) return;
      const inverser = (prev: TeamMapping[]) => prev.map((m) => (m.id === clubId ? { ...m, is_followed: !m.is_followed } : m));
      setMappings(inverser);
      startTransition(async () => {
        const result = await toggleFollow(club.subject);
        if (result?.error) setMappings(inverser); // annule l'optimiste
      });
    },
    [mappings],
  );

  const addClub = useCallback((t: ApiTeamAdded) => {
    setMappings((prev) => (prev.some((m) => m.is_club && m.api_team_id === t.apiTeamId) ? prev : [nouveauClub(t), ...prev]));
  }, []);

  return { mappings, setMappings, toggleFollowClub, addClub };
}

/** Club dont la suppression attend confirmation : gardé pendant l'animation de fermeture (titre stable). */
export type SuppressionClub = { ouvert: boolean; club: TeamMapping | null };

// Suppression d'un club : demandée (ouvre kit/Confirmation), puis confirmée.
function useSuppressionClub(setMappings: Dispatch<SetStateAction<TeamMapping[]>>, setSubjectLinks: Dispatch<SetStateAction<SubjectLink[]>>) {
  const [suppression, setSuppression] = useState<SuppressionClub>({ ouvert: false, club: null });
  const [, startTransition] = useTransition();

  const deleteClub = useCallback((club: TeamMapping) => setSuppression({ ouvert: true, club }), []);
  const fermerSuppression = useCallback(() => setSuppression((s) => ({ ...s, ouvert: false })), []);

  const confirmerSuppression = useCallback(() => {
    const club = suppression.club;
    if (!club) return;
    setMappings((prev) => prev.filter((m) => m.id !== club.id));
    setSubjectLinks((prev) => prev.filter((l) => l.team_mapping_id !== club.id));
    startTransition(async () => {
      await deleteTeamMapping(club.id);
    });
  }, [suppression.club, setMappings, setSubjectLinks]);

  return { suppression, deleteClub, fermerSuppression, confirmerSuppression };
}

// État et actions de « Mes équipes » : clubs/nationales (is_club), sujets libres et liens N:N.
export function useFollowedTeams(initialMappings: TeamMapping[]) {
  const { mappings, setMappings, toggleFollowClub, addClub } = useMappings(initialMappings);
  const { subjectLinks, setSubjectLinks, link, unlink } = useSubjectLinks();
  const suppression = useSuppressionClub(setMappings, setSubjectLinks);

  const clubs = trierClubs(mappings);
  // Sujets non liés = enregistrements hors club sans aucune entrée dans subject_links
  const linkedSubjectNameSet = useMemo(() => new Set(subjectLinks.map((l) => l.subject)), [subjectLinks]);
  const subjects = mappings.filter((m) => !m.is_club && !linkedSubjectNameSet.has(m.subject));

  const linkedSubjectsOf = useCallback(
    (clubId: string) => {
      const linkedNames = subjectLinks.filter((l) => l.team_mapping_id === clubId).map((l) => l.subject);
      return mappings.filter((m) => !m.is_club && linkedNames.includes(m.subject));
    },
    [subjectLinks, mappings],
  );

  return {
    mappings,
    subjectLinks,
    clubs,
    subjects,
    ...suppression,
    toggleFollowClub,
    link,
    unlink,
    linkedSubjectsOf,
    addClub,
  };
}
