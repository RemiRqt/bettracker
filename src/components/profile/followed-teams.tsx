"use client";

import { useState, useCallback } from "react";
import type { TeamMapping } from "@/actions/teams";
import { Link2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { AddApiTeamDialog } from "@/components/teams/add-api-team-dialog";
import { useFollowedTeams } from "./use-followed-teams";
import { ClubRow } from "./club-row";
import { LinkSubjectsPopup, LinkClubsPopup } from "./link-popups";

interface FollowedTeamsProps {
  teamMappings: TeamMapping[];
}

// Cible d'une popup de liaison : gardée pendant l'animation de fermeture (titre stable).
type Cible<T> = { ouvert: boolean; valeur: T | null };
const FERMEE = { ouvert: false, valeur: null };

export function FollowedTeams({ teamMappings: initialMappings }: FollowedTeamsProps) {
  const t = useFollowedTeams(initialMappings);
  const { clubs, subjects } = t;

  const [addClubOpen, setAddClubOpen] = useState(false);
  // Link subject to club popup (from club expand)
  const [linkClub, setLinkClub] = useState<Cible<string>>(FERMEE);
  // Link unlinked subject to existing club/national popup
  const [linkUnlinked, setLinkUnlinked] = useState<Cible<string>>(FERMEE);

  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
  const [showMore, setShowMore] = useState(false);

  const toggleClubExpand = useCallback((id: string) => {
    setExpandedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleLink = (subjectName: string, club: TeamMapping) => {
    t.link(subjectName, club);
    setLinkClub((c) => ({ ...c, ouvert: false }));
    setLinkUnlinked((c) => ({ ...c, ouvert: false }));
  };

  const favorites = clubs.filter((c) => c.is_followed);
  const others = clubs.filter((c) => !c.is_followed);

  const renderClub = (club: TeamMapping) => (
    <ClubRow
      key={club.id}
      club={club}
      linked={t.linkedSubjectsOf(club.id)}
      expanded={expandedClubs.has(club.id)}
      onToggleExpand={() => toggleClubExpand(club.id)}
      onToggleFollow={() => t.toggleFollowClub(club.id)}
      onDelete={() => t.deleteClub(club)}
      onUnlink={(subject) => t.unlink(subject, club.id)}
      onOpenLink={() => setLinkClub({ ouvert: true, valeur: club.id })}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground">Mes équipes</h2>
        <button
          onClick={() => setAddClubOpen(true)}
          aria-label="Ajouter une équipe"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus aria-hidden className="h-5 w-5" />
        </button>
      </div>

      {/* Favorites shown by default */}
      {favorites.length > 0 ? (
        <div className="space-y-2">{favorites.map(renderClub)}</div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Aucune équipe en favori. Touche l&apos;étoile d&apos;une équipe pour l&apos;épingler ici.
        </p>
      )}

      {/* Voir plus: non-favorites + unlinked subjects */}
      {(others.length > 0 || subjects.length > 0) && (
        <div className="space-y-2">
          <button
            onClick={() => setShowMore((s) => !s)}
            aria-expanded={showMore}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showMore ? (
              <ChevronDown aria-hidden className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            )}
            Voir plus ({others.length + subjects.length})
          </button>
          {showMore && (
            <div className="space-y-3">
              {others.length > 0 && <div className="space-y-2">{others.map(renderClub)}</div>}
              {subjects.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Non lies ({subjects.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setLinkUnlinked({ ouvert: true, valeur: s.subject })}
                        className="px-2.5 py-1 rounded-full bg-background text-xs text-muted-foreground border border-border/50 hover:border-primary hover:text-primary transition-colors"
                      >
                        <Link2 aria-hidden className="h-3 w-3 inline mr-1" />
                        {s.subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <AddApiTeamDialog
        open={addClubOpen}
        onOpenChange={setAddClubOpen}
        niveau={0}
        existingApiTeamIds={clubs.map((c) => c.api_team_id).filter((id): id is number => id != null)}
        onTeamAdded={t.addClub}
      />

      <LinkSubjectsPopup
        ouvert={linkClub.ouvert}
        fermer={() => setLinkClub((c) => ({ ...c, ouvert: false }))}
        club={clubs.find((c) => c.id === linkClub.valeur) ?? null}
        mappings={t.mappings}
        subjectLinks={t.subjectLinks}
        onLink={handleLink}
      />

      <LinkClubsPopup
        ouvert={linkUnlinked.ouvert}
        fermer={() => setLinkUnlinked((c) => ({ ...c, ouvert: false }))}
        subject={linkUnlinked.valeur}
        clubs={clubs}
        subjectLinks={t.subjectLinks}
        onLink={handleLink}
      />
    </div>
  );
}
