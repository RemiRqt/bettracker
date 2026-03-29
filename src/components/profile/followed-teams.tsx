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

  // Add club dialog
  const [addClubOpen, setAddClubOpen] = useState(false);
  const [clubSearch, setClubSearch] = useState("");
  const [clubResults, setClubResults] = useState<ApiTeamResult[]>([]);
  const [isSearchingClub, setIsSearchingClub] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // Link subject to club dialog (from club expand)
  const [linkClubId, setLinkClubId] = useState<string | null>(null);
  const [linkSubjectSearch, setLinkSubjectSearch] = useState("");

  // Link unlinked subject to existing club dialog
  const [linkUnlinkedSubject, setLinkUnlinkedSubject] = useState<string | null>(null);

  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());

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

  const handleClubSearchSubmit = useCallback(async () => {
    const query = clubSearch.trim();
    if (query.length < 3) return;
    setIsSearchingClub(true);
    setHasSearched(true);
    setClubResults([]);
    try {
      const res = await fetch(`/api/football/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setClubResults(Array.isArray(data) ? data : []);
      }
    } catch { setClubResults([]); }
    finally { setIsSearchingClub(false); }
  }, [clubSearch]);

  const handleAddClub = useCallback((club: ApiTeamResult) => {
    // Check if already exists
    if (clubs.some((m) => m.api_team_id === club.id)) {
      setAddClubOpen(false); setClubSearch(""); setClubResults([]); setHasSearched(false);
      return;
    }

    // Optimistic add
    const newMapping: TeamMapping = {
      id: crypto.randomUUID(),
      user_id: "",
      subject: club.name,
      sport: "football",
      api_team_id: club.id,
      logo_url: club.logo,
      is_club: true,
      is_followed: false,
      next_matches_count: 2,
      cached_fixtures: null,
      fixtures_updated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMappings((prev) => [newMapping, ...prev]);

    startTransition(async () => {
      await addClub(club.id, club.name, club.logo);
    });

    setAddClubOpen(false); setClubSearch(""); setClubResults([]); setHasSearched(false);
  }, [clubs]);

  const handleDeleteClub = useCallback((club: TeamMapping) => {
    if (!confirm(`Supprimer ${club.subject} ?`)) return;
    // Remove club and unlink all subjects linked to it
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
  }, []);

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

  return (
    <div className="space-y-4">
      {/* Add club button */}
      <button
        onClick={() => setAddClubOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-600 text-sm text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Ajouter une equipe
      </button>

      {/* Clubs */}
      {clubs.length > 0 && (
        <div className="space-y-2">
          {clubs.map((club) => {
            const isExpanded = expandedClubs.has(club.id);
            const linked = getLinkedSubjects(club.api_team_id!);

            return (
              <div key={club.id} className="rounded-xl bg-[#0f172a] overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <TeamLogo logoUrl={club.logo_url} sport={club.sport} size="md" />

                  <button
                    onClick={() => toggleClubExpand(club.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-medium text-white truncate">{club.subject}</p>
                    <p className="text-xs text-slate-500">
                      {linked.length} lie{linked.length !== 1 ? "s" : ""}
                    </p>
                  </button>

                  {/* Follow for calendar */}
                  <button onClick={() => handleToggleFollow(club.id)}>
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        club.is_followed
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600 hover:text-amber-400"
                      )}
                    />
                  </button>

                  {/* Expand */}
                  <button onClick={() => toggleClubExpand(club.id)}>
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-slate-500" />
                      : <ChevronRight className="h-4 w-4 text-slate-500" />
                    }
                  </button>

                  {/* Delete club */}
                  <button onClick={() => handleDeleteClub(club)}>
                    <Trash2 className="h-4 w-4 text-slate-600 hover:text-red-400 transition-colors" />
                  </button>
                </div>

                {/* Expanded: linked subjects + link button */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50 px-3 pb-3 pt-2 space-y-1.5">
                    {linked.map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-[#1e293b]/50">
                        <span className="text-xs text-slate-300">{s.subject}</span>
                        <button
                          onClick={() => handleUnlinkSubject(s.subject)}
                          className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => { setLinkClubId(club.id); setLinkSubjectSearch(""); }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-700 text-xs text-slate-500 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      <Link2 className="h-3 w-3" />
                      Lier un joueur/equipe
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unlinked subjects */}
      {subjects.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
            Non lies ({subjects.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setLinkUnlinkedSubject(s.subject)}
                className="px-2.5 py-1 rounded-full bg-[#0f172a] text-xs text-slate-400 border border-slate-700/50 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <Link2 className="h-3 w-3 inline mr-1" />
                {s.subject}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* === DIALOGS === */}

      {/* Add club dialog (API search) */}
      <Dialog open={addClubOpen} onOpenChange={setAddClubOpen}>
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Ajouter une equipe</DialogTitle>
            <DialogDescription className="text-slate-400">
              Recherchez une equipe pour recuperer son logo
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => { e.preventDefault(); handleClubSearchSubmit(); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={clubSearch}
                onChange={(e) => setClubSearch(e.target.value)}
                placeholder="Ex: PSG, Bayern, France..."
                className="w-full bg-[#0f172a] border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={clubSearch.trim().length < 3 || isSearchingClub}
              className="px-4 py-2.5 rounded-xl bg-[#10b981] text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearchingClub ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
            </button>
          </form>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {isSearchingClub && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}
            {!isSearchingClub && clubResults.length === 0 && hasSearched && (
              <p className="text-sm text-slate-500 text-center py-6">Aucun resultat</p>
            )}
            {clubResults.map((club) => {
              const alreadyAdded = clubs.some((m) => m.api_team_id === club.id);
              return (
                <button
                  key={club.id}
                  onClick={() => handleAddClub(club)}
                  disabled={alreadyAdded}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors",
                    alreadyAdded ? "opacity-50 cursor-not-allowed" : "hover:bg-[#0f172a]"
                  )}
                >
                  <img src={club.logo} alt="" className="h-8 w-8 object-contain" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{club.name}</p>
                    {club.country && <p className="text-xs text-slate-500">{club.country}</p>}
                  </div>
                  {alreadyAdded && <span className="text-xs text-emerald-400">Ajoute</span>}
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
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Lier a {clubs.find((c) => c.id === linkClubId)?.subject}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Choisissez un joueur ou equipe a associer
            </DialogDescription>
          </DialogHeader>

          {subjects.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={linkSubjectSearch}
                onChange={(e) => setLinkSubjectSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-[#0f172a] border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-1">
            {filteredSubjects.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
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
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f172a] transition-colors text-left"
                  >
                    <span className="text-sm text-white">{s.subject}</span>
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
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Lier &laquo; {linkUnlinkedSubject} &raquo;
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Choisissez l&apos;equipe a associer
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {clubs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                Ajoutez d&apos;abord une equipe avec le bouton ci-dessus
              </p>
            ) : (
              clubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => handleLinkSubject(linkUnlinkedSubject!, club)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f172a] transition-colors text-left"
                >
                  <TeamLogo logoUrl={club.logo_url} sport={club.sport} size="sm" />
                  <span className="text-sm text-white">{club.subject}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
