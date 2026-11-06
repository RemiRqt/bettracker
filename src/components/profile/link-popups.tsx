"use client";

import { useState } from "react";
import type { TeamMapping, SubjectLink } from "@/actions/teams";
import { TeamLogo } from "@/components/ui/team-logo";
import { Popup } from "@/components/kit/Popup";
import { Search } from "lucide-react";

const LIGNE = "w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-background transition-colors text-left";

function Vide({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground text-center py-6">{children}</p>;
}

interface LinkSubjectsPopupProps {
  ouvert: boolean;
  fermer: () => void;
  club: TeamMapping | null;
  mappings: TeamMapping[];
  subjectLinks: SubjectLink[];
  onLink: (subject: string, club: TeamMapping) => void;
}

// Depuis une équipe dépliée : choisir un joueur/équipe (sujet) à lui lier.
export function LinkSubjectsPopup({ ouvert, fermer, club, mappings, subjectLinks, onLink }: LinkSubjectsPopupProps) {
  return (
    <Popup
      ouvert={ouvert}
      fermer={fermer}
      titre={`Lier a ${club?.subject ?? ""}`}
      description="Choisissez un joueur ou equipe a associer"
    >
      {club && <ListeSujets club={club} mappings={mappings} subjectLinks={subjectLinks} onLink={onLink} />}
    </Popup>
  );
}

/** Monté à chaque ouverture : la recherche repart vide. */
function ListeSujets({ club, mappings, subjectLinks, onLink }: Omit<LinkSubjectsPopupProps, "ouvert" | "fermer"> & { club: TeamMapping }) {
  const [search, setSearch] = useState("");
  // Sujets disponibles : tous les non-clubs pas encore liés à ce club
  const alreadyLinked = new Set(subjectLinks.filter((l) => l.team_mapping_id === club.id).map((l) => l.subject));
  const available = mappings.filter((m) => !m.is_club && !alreadyLinked.has(m.subject));
  const filtered = search
    ? available.filter((s) => s.subject.toLowerCase().includes(search.toLowerCase()))
    : available;

  return (
    <div className="space-y-3">
      {available.length > 5 && (
        <div className="relative">
          <Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            aria-label="Rechercher un joueur ou une équipe"
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
        </div>
      )}
      <div className="max-h-72 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <Vide>{available.length === 0 ? "Tous les sujets sont deja lies" : "Aucun resultat"}</Vide>
        ) : (
          filtered.map((s) => (
            <button key={s.id} onClick={() => onLink(s.subject, club)} className={LIGNE}>
              <span className="text-sm text-foreground">{s.subject}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

interface LinkClubsPopupProps {
  ouvert: boolean;
  fermer: () => void;
  subject: string | null;
  clubs: TeamMapping[];
  subjectLinks: SubjectLink[];
  onLink: (subject: string, club: TeamMapping) => void;
}

// Depuis un sujet non lié : choisir l'équipe ou la nationale à laquelle le lier.
export function LinkClubsPopup({ ouvert, fermer, subject, clubs, subjectLinks, onLink }: LinkClubsPopupProps) {
  const alreadyLinkedIds = new Set(subjectLinks.filter((l) => l.subject === subject).map((l) => l.team_mapping_id));
  const available = clubs.filter((c) => !alreadyLinkedIds.has(c.id));

  return (
    <Popup
      ouvert={ouvert}
      fermer={fermer}
      titre={`Lier « ${subject ?? ""} »`}
      description="Choisissez l'equipe ou la nationale a associer"
    >
      <div className="max-h-72 overflow-y-auto space-y-1">
        {clubs.length === 0 ? (
          <Vide>Ajoutez d&apos;abord une equipe avec le bouton ci-dessus</Vide>
        ) : available.length === 0 ? (
          <Vide>Toutes les equipes sont deja liees</Vide>
        ) : (
          subject &&
          available.map((club) => (
            <button key={club.id} onClick={() => onLink(subject, club)} className={LIGNE}>
              <TeamLogo logoUrl={club.logo_url} sport={club.sport} size="sm" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-foreground">{club.subject}</span>
                {club.kind === "national" && <span className="ml-2 text-xs text-muted-foreground">Nationale</span>}
              </div>
            </button>
          ))
        )}
      </div>
    </Popup>
  );
}
