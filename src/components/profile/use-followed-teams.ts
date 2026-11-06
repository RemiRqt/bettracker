"use client";

import { useState, useTransition, useCallback, useEffect, useMemo } from "react";
import { toggleFollow, deleteTeamMapping } from "@/actions/teams";
import { linkSubject, unlinkSubject, getSubjectLinks } from "@/actions/subject-links";
import type { TeamMapping, SubjectLink } from "@/actions/teams";
import type { ApiTeamAdded } from "@/components/teams/add-api-team-dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";

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

// État et actions de « Mes équipes » : clubs/nationales (is_club), sujets libres et liens N:N.
export function useFollowedTeams(initialMappings: TeamMapping[]) {
  const [mappings, setMappings] = useState(initialMappings);
  const [subjectLinks, setSubjectLinks] = useState<SubjectLink[]>([]);
  const [, startTransition] = useTransition();
  const confirm = useConfirm();

  // Load subject links on mount
  useEffect(() => {
    getSubjectLinks().then(setSubjectLinks).catch(() => {});
  }, []);

  // Clubs = records with is_club=true (includes nationals added with is_club=true)
  const clubs = mappings
    .filter((m) => m.is_club)
    .sort((a, b) => {
      if (a.is_followed !== b.is_followed) return a.is_followed ? -1 : 1;
      return a.subject.localeCompare(b.subject);
    });

  // Unlinked subjects = non-club records with NO entries in subject_links
  const linkedSubjectNameSet = useMemo(() => new Set(subjectLinks.map((l) => l.subject)), [subjectLinks]);
  const subjects = mappings.filter((m) => !m.is_club && !linkedSubjectNameSet.has(m.subject));

  const deleteClub = useCallback(async (club: TeamMapping) => {
    const ok = await confirm({
      title: `Supprimer ${club.subject} ?`,
      description: "Le club sera dissocié des paris qui y sont liés.",
      confirmLabel: "Supprimer",
      variant: "destructive",
    });
    if (!ok) return;
    setMappings((prev) => prev.filter((m) => m.id !== club.id));
    // Also remove any subject_links pointing to this club
    setSubjectLinks((prev) => prev.filter((l) => l.team_mapping_id !== club.id));
    startTransition(async () => {
      await deleteTeamMapping(club.id);
    });
  }, [confirm]);

  const toggleFollowClub = useCallback((clubId: string) => {
    const club = mappings.find((m) => m.id === clubId);
    if (!club) return;
    const inverser = (prev: TeamMapping[]) =>
      prev.map((m) => (m.id === clubId ? { ...m, is_followed: !m.is_followed } : m));
    setMappings(inverser);
    startTransition(async () => {
      const result = await toggleFollow(club.subject);
      // Revert optimistic update on failure
      if (result?.error) setMappings(inverser);
    });
  }, [mappings]);

  // Link a subject to a club/national (N:N via subject_links), optimistic
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

  // Unlink a subject from a specific club/national
  const unlink = useCallback((subjectName: string, clubId: string) => {
    setSubjectLinks((prev) => prev.filter((l) => !(l.subject === subjectName && l.team_mapping_id === clubId)));
    startTransition(async () => {
      await unlinkSubject(subjectName, clubId);
    });
  }, []);

  // Subjects linked to a club via subject_links
  const linkedSubjectsOf = useCallback((clubId: string) => {
    const linkedNames = subjectLinks.filter((l) => l.team_mapping_id === clubId).map((l) => l.subject);
    return mappings.filter((m) => !m.is_club && linkedNames.includes(m.subject));
  }, [subjectLinks, mappings]);

  const addClub = useCallback((t: ApiTeamAdded) => {
    setMappings((prev) =>
      prev.some((m) => m.is_club && m.api_team_id === t.apiTeamId) ? prev : [nouveauClub(t), ...prev]
    );
  }, []);

  return {
    mappings,
    subjectLinks,
    clubs,
    subjects,
    deleteClub,
    toggleFollowClub,
    link,
    unlink,
    linkedSubjectsOf,
    addClub,
  };
}
