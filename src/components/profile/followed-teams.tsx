"use client";

import { useState, useTransition, useCallback } from "react";
import {
  toggleFollow,
  linkTeamToApi,
  unlinkTeamFromApi,
  addClub,
  deleteTeamMapping,
} from "@/actions/teams";
import type { TeamMapping } from "@/actions/teams";
import { TeamLogo } from "@/components/ui/team-logo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Star, Link2, Search, Loader2, Plus, X, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOOTBALL_DATA_COMPETITIONS } from "@/lib/constants";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface FollowedTeamsProps {
  teamMappings: TeamMapping[];
}

interface ApiTeamResult {
  id: number;
  name: string;
  country: string | null;
  logo: string;
}

export function FollowedTeams({ teamMappings: initialMappings }: FollowedTeamsProps) {
  const [mappings, setMappings] = useState(initialMappings);
  const [, startTransition] = useTransition();
  const confirm = useConfirm();

  // Add club dialog
  const [addClubOpen, setAddClubOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [clubResults, setClubResults] = useState<ApiTeamResult[]>([]);
  const [isSearchingClub, setIsSearchingClub] = useState(false);
  // Link subject to club dialog (from club expand)
  const [linkClubId, setLinkClubId] = useState<string | null>(null);
  const [linkSubjectSearch, setLinkSubjectSearch] = useState("");

  // Link unlinked subject to existing club dialog
  const [linkUnlinkedSubject, setLinkUnlinkedSubject] = useState<string | null>(null);

  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());
  const [showMore, setShowMore] = useState(false);

  // === Derived data ===
  // Clubs = records with is_club=true
  const clubs = mappings
    .filter((m) => m.is_club)
    .sort((a, b) => {
      if (a.is_followed !== b.is_followed) return a.is_followed ? -1 : 1;
      return a.subject.localeCompare(b.subject);
    });

  // Unlinked subjects = records with is_club=false AND api_team_id=null
  const subjects = mappings.filter((m) => !m.is_club && m.api_team_id === null);

  // === Handlers ===

  const loadCompetitionTeams = useCallback(async (code: string) => {
    if (!code) return;
    setSelectedCompetition(code);
    setIsSearchingClub(true);
    setClubResults([]);
    setClubFilter("");
    try {
      const res = await fetch(`/api/football/search?competition=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setClubResults(Array.isArray(data) ? data : []);
      }
    } catch { setClubResults([]); }
    finally { setIsSearchingClub(false); }
  }, []);

  const handleAddClub = useCallback((club: ApiTeamResult) => {
    // Check if already exists
    if (clubs.some((m) => m.api_team_id === club.id)) {
      setAddClubOpen(false); setSelectedCompetition(""); setClubResults([]); setClubFilter("");
      return;
    }

    // Optimistic add
    const isWC = selectedCompetition === "WC";
    const newMapping: TeamMapping = {
      id: crypto.randomUUID(),
      user_id: "",
      subject: club.name,
      sport: "football",
      api_team_id: club.id,
      logo_url: club.logo,
      is_club: true,
      kind: isWC ? "national" : "club",
      country: isWC ? club.name : null,
      provider: "football-data",
      is_followed: false,
      next_matches_count: 2,
      cached_fixtures: null,
      fixtures_updated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMappings((prev) => [newMapping, ...prev]);

    startTransition(async () => {
      await addClub(club.id, club.name, club.logo,
        isWC ? { kind: "national", country: club.name } : undefined);
    });

    setAddClubOpen(false); setSelectedCompetition(""); setClubResults([]); setClubFilter("");
  }, [clubs]);

  const handleDeleteClub = useCallback(async (club: TeamMapping) => {
    const ok = await confirm({
      title: `Supprimer ${club.subject} ?`,
      description: "Le club sera dissocié des paris qui y sont liés.",
      confirmLabel: "Supprimer",
      variant: "destructive",
    });
    if (!ok) return;
    setMappings((prev) =>
      prev
        .filter((m) => m.id !== club.id)
        .map((m) =>
          !m.is_club && m.api_team_id === club.api_team_id
            ? { ...m, api_team_id: null, logo_url: null }
            : m
        )
    );
    startTransition(async () => {
      await deleteTeamMapping(club.id);
    });
  }, [confirm]);

  const handleToggleFollow = useCallback((clubId: string) => {
    const club = mappings.find((m) => m.id === clubId);
    if (!club) return;
    setMappings((prev) =>
      prev.map((m) => m.id === clubId ? { ...m, is_followed: !m.is_followed } : m)
    );
    startTransition(async () => {
      const result = await toggleFollow(club.subject);
      if (result?.error) {
        // Revert optimistic update on failure
        setMappings((prev) =>
          prev.map((m) => m.id === clubId ? { ...m, is_followed: !m.is_followed } : m)
        );
      }
    });
  }, [mappings]);

  // Link a subject to a club
  const handleLinkSubject = useCallback((subjectName: string, club: TeamMapping) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.subject === subjectName && !m.is_club
          ? { ...m, api_team_id: club.api_team_id, logo_url: club.logo_url }
          : m
      )
    );
    startTransition(async () => {
      await linkTeamToApi(subjectName, club.api_team_id!, club.logo_url || "");
    });
    setLinkClubId(null);
    setLinkUnlinkedSubject(null);
    setLinkSubjectSearch("");
  }, []);

  // Unlink a subject
  const handleUnlinkSubject = useCallback((subjectName: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.subject === subjectName && !m.is_club
          ? { ...m, api_team_id: null, logo_url: null }
          : m
      )
    );
    startTransition(async () => { await unlinkTeamFromApi(subjectName); });
  }, []);

  const toggleClubExpand = useCallback((id: string) => {
    setExpandedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Get subjects linked to a club (non-club records with same api_team_id)
  const getLinkedSubjects = useCallback((clubApiId: number) => {
    return mappings.filter((m) => !m.is_club && m.api_team_id === clubApiId);
  }, [mappings]);

  // Filter subjects for link dialog search
  const filteredSubjects = linkSubjectSearch
    ? subjects.filter((s) => s.subject.toLowerCase().includes(linkSubjectSearch.toLowerCase()))
    : subjects;

  const favorites = clubs.filter((c) => c.is_followed);
  const others = clubs.filter((c) => !c.is_followed);

  const renderClub = (club: TeamMapping) => {
    const isExpanded = expandedClubs.has(club.id);
    const linked = getLinkedSubjects(club.api_team_id!);
    return (
      <div key={club.id} className="rounded-xl bg-background overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <TeamLogo logoUrl={club.logo_url} sport={club.sport} size="md" />
          <button
            onClick={() => toggleClubExpand(club.id)}
            className="flex-1 min-w-0 text-left"
          >
            <p className="text-sm font-medium text-foreground truncate">{club.subject}</p>
            <p className="text-xs text-muted-foreground">
              {linked.length} lie{linked.length !== 1 ? "s" : ""}
            </p>
          </button>
          <button onClick={() => handleToggleFollow(club.id)}>
            <Star
              className={cn(
                "h-5 w-5 transition-colors",
                club.is_followed
                  ? "text-warning fill-warning"
                  : "text-muted-foreground hover:text-warning"
              )}
            />
          </button>
          <button onClick={() => toggleClubExpand(club.id)}>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button onClick={() => handleDeleteClub(club)}>
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        </div>
        {isExpanded && (
          <div className="border-t border-border/50 px-3 pb-3 pt-2 space-y-1.5">
            {linked.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-card/50"
              >
                <span className="text-xs text-secondary-foreground">{s.subject}</span>
                <button
                  onClick={() => handleUnlinkSubject(s.subject)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => { setLinkClubId(club.id); setLinkSubjectSearch(""); }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Link2 className="h-3 w-3" />
              Lier un joueur/equipe
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
          Mes équipes
        </h2>
        <button
          onClick={() => setAddClubOpen(true)}
          aria-label="Ajouter une équipe"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Favorites shown by default */}
      {favorites.length > 0 ? (
        <div className="space-y-2">{favorites.map(renderClub)}</div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Aucune équipe en favori. Touche l&apos;étoile d&apos;une équipe pour
          l&apos;épingler ici.
        </p>
      )}

      {/* Voir plus: non-favorites + unlinked subjects */}
      {(others.length > 0 || subjects.length > 0) && (
        <div className="space-y-2">
          <button
            onClick={() => setShowMore((s) => !s)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showMore ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Voir plus ({others.length + subjects.length})
          </button>
          {showMore && (
            <div className="space-y-3">
              {others.length > 0 && (
                <div className="space-y-2">{others.map(renderClub)}</div>
              )}
              {subjects.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Non lies ({subjects.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setLinkUnlinkedSubject(s.subject)}
                        className="px-2.5 py-1 rounded-full bg-background text-xs text-muted-foreground border border-border/50 hover:border-primary hover:text-primary transition-colors"
                      >
                        <Link2 className="h-3 w-3 inline mr-1" />
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

      {/* === DIALOGS === */}

      {/* Add club dialog (API search) */}
      <Dialog open={addClubOpen} onOpenChange={setAddClubOpen}>
        <DialogContent className="bg-card border border-border text-foreground max-w-md mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Ajouter une equipe</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Recherchez une equipe pour recuperer son logo
            </DialogDescription>
          </DialogHeader>

          {/* Competition picker */}
          <div className="flex flex-wrap gap-1.5">
            {FOOTBALL_DATA_COMPETITIONS.map((comp) => (
              <button
                key={comp.code}
                onClick={() => loadCompetitionTeams(comp.code)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  selectedCompetition === comp.code
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground border border-border"
                )}
              >
                {comp.flag} {comp.name}
              </button>
            ))}
          </div>

          {/* Filter within loaded teams */}
          {clubResults.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={clubFilter}
                onChange={(e) => setClubFilter(e.target.value)}
                placeholder="Filtrer..."
                className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-1">
            {isSearchingClub && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isSearchingClub && selectedCompetition && clubResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune equipe trouvee</p>
            )}
            {clubResults
              .filter((club) =>
                !clubFilter || club.name.toLowerCase().includes(clubFilter.toLowerCase())
              )
              .map((club) => {
                const alreadyAdded = clubs.some((m) => m.api_team_id === club.id);
                return (
                  <button
                    key={club.id}
                    onClick={() => handleAddClub(club)}
                    disabled={alreadyAdded}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors",
                      alreadyAdded ? "opacity-50 cursor-not-allowed" : "hover:bg-background"
                    )}
                  >
                    <img src={club.logo} alt="" className="h-8 w-8 object-contain rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{club.name}</p>
                    </div>
                    {alreadyAdded && <span className="text-xs text-primary">Ajoutee</span>}
                  </button>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Link subject to club dialog (from club expand) */}
      <Dialog
        open={linkClubId !== null}
        onOpenChange={(open) => { if (!open) { setLinkClubId(null); setLinkSubjectSearch(""); } }}
      >
        <DialogContent className="bg-card border border-border text-foreground max-w-md mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Lier a {clubs.find((c) => c.id === linkClubId)?.subject}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choisissez un joueur ou equipe a associer
            </DialogDescription>
          </DialogHeader>

          {subjects.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={linkSubjectSearch}
                onChange={(e) => setLinkSubjectSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-1">
            {filteredSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {subjects.length === 0 ? "Tous les sujets sont deja lies" : "Aucun resultat"}
              </p>
            ) : (
              filteredSubjects.map((s) => {
                const targetClub = clubs.find((c) => c.id === linkClubId);
                if (!targetClub) return null;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleLinkSubject(s.subject, targetClub)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-background transition-colors text-left"
                  >
                    <span className="text-sm text-foreground">{s.subject}</span>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Link unlinked subject to existing club dialog */}
      <Dialog
        open={linkUnlinkedSubject !== null}
        onOpenChange={(open) => { if (!open) setLinkUnlinkedSubject(null); }}
      >
        <DialogContent className="bg-card border border-border text-foreground max-w-md mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Lier &laquo; {linkUnlinkedSubject} &raquo;
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choisissez l&apos;equipe a associer
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {clubs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Ajoutez d&apos;abord une equipe avec le bouton ci-dessus
              </p>
            ) : (
              clubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => handleLinkSubject(linkUnlinkedSubject!, club)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-background transition-colors text-left"
                >
                  <TeamLogo logoUrl={club.logo_url} sport={club.sport} size="sm" />
                  <span className="text-sm text-foreground">{club.subject}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
