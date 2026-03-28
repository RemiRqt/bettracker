"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import {
  toggleFollow,
  linkTeamToApi,
  unlinkTeamFromApi,
  upsertTeamMapping,
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
  const clubSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Link subject to club dialog
  const [linkClubSubject, setLinkClubSubject] = useState<string | null>(null);
  const [linkSubjectSearch, setLinkSubjectSearch] = useState("");

  // Link unlinked subject to existing club dialog
  const [linkUnlinkedSubject, setLinkUnlinkedSubject] = useState<string | null>(null);

  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());

  // Derive clubs and unlinked subjects
  // Clubs = one entry per unique api_team_id (prefer the one with logo_url)
  const clubMap = new Map<number, TeamMapping>();
  for (const m of mappings) {
    if (m.api_team_id !== null) {
      const existing = clubMap.get(m.api_team_id);
      if (!existing || (!existing.logo_url && m.logo_url)) {
        clubMap.set(m.api_team_id, m);
      }
    }
  }
  const clubs = [...clubMap.values()].sort((a, b) => {
    // Followed first, then A-Z
    if (a.is_followed !== b.is_followed) return a.is_followed ? -1 : 1;
    return a.subject.localeCompare(b.subject);
  });
  const subjects = mappings.filter((m) => m.api_team_id === null);

  // --- Handlers ---

  // Search API-Football for adding clubs
  const handleClubSearch = useCallback((query: string) => {
    setClubSearch(query);
    if (clubSearchTimeout.current) clearTimeout(clubSearchTimeout.current);
    if (query.trim().length < 3) { setClubResults([]); return; }

    clubSearchTimeout.current = setTimeout(async () => {
      setIsSearchingClub(true);
      try {
        const res = await fetch(`/api/football/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setClubResults(Array.isArray(data) ? data : []);
        }
      } catch { setClubResults([]); }
      finally { setIsSearchingClub(false); }
    }, 500);
  }, []);

  // Add API team as a club
  const handleAddClub = useCallback((club: ApiTeamResult) => {
    if (mappings.some((m) => m.api_team_id === club.id)) {
      setAddClubOpen(false); setClubSearch(""); setClubResults([]);
      return;
    }

    const newMapping: TeamMapping = {
      id: crypto.randomUUID(),
      user_id: "",
      subject: club.name,
      sport: "football",
      api_team_id: club.id,
      logo_url: club.logo,
      is_followed: false,
      next_matches_count: 2,
      cached_fixtures: null,
      fixtures_updated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMappings((prev) => [newMapping, ...prev]);

    startTransition(async () => {
      await upsertTeamMapping(club.name, {
        api_team_id: club.id,
        logo_url: club.logo,
        sport: "football",
      });
    });

    setAddClubOpen(false); setClubSearch(""); setClubResults([]);
  }, [mappings]);

  // Delete a club (and unlink all subjects linked to it)
  const handleDeleteClub = useCallback((club: TeamMapping) => {
    if (!confirm(`Supprimer ${club.subject} ?`)) return;
    const apiId = club.api_team_id;
    setMappings((prev) =>
      prev
        .filter((m) => m.id !== club.id)
        .map((m) =>
          m.api_team_id === apiId
            ? { ...m, api_team_id: null, logo_url: null, is_followed: false }
            : m
        )
    );
    startTransition(async () => {
      await deleteTeamMapping(club.id);
    });
  }, []);

  // Toggle follow for calendar
  const handleToggleFollow = useCallback((subject: string) => {
    setMappings((prev) =>
      prev.map((m) => m.subject === subject ? { ...m, is_followed: !m.is_followed } : m)
    );
    startTransition(async () => { await toggleFollow(subject); });
  }, []);

  // Link a subject to a club (from club expand or from unlinked subject)
  const handleLinkSubject = useCallback((subjectName: string, club: TeamMapping) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.subject === subjectName
          ? { ...m, api_team_id: club.api_team_id, logo_url: club.logo_url }
          : m
      )
    );
    startTransition(async () => {
      await linkTeamToApi(subjectName, club.api_team_id!, club.logo_url || "");
    });
    setLinkClubSubject(null);
    setLinkUnlinkedSubject(null);
    setLinkSubjectSearch("");
  }, []);

  // Unlink a subject from its club
  const handleUnlinkSubject = useCallback((subjectName: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.subject === subjectName
          ? { ...m, api_team_id: null, logo_url: null, is_followed: false }
          : m
      )
    );
    startTransition(async () => { await unlinkTeamFromApi(subjectName); });
  }, []);

  // Toggle club expand
  const toggleClubExpand = useCallback((subject: string) => {
    setExpandedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  }, []);

  // Get linked subjects for a club (other mappings with same api_team_id)
  const getLinkedSubjects = useCallback((clubApiId: number, clubSubject: string) => {
    return mappings.filter((m) => m.api_team_id === clubApiId && m.subject !== clubSubject);
  }, [mappings]);

  // Filter subjects for search in link dialog
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
            const isExpanded = expandedClubs.has(club.subject);
            const linked = getLinkedSubjects(club.api_team_id!, club.subject);

            return (
              <div key={club.id} className="rounded-xl bg-[#0f172a] overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <TeamLogo logoUrl={club.logo_url} sport={club.sport} size="md" />

                  <button
                    onClick={() => toggleClubExpand(club.subject)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-medium text-white truncate">{club.subject}</p>
                    <p className="text-xs text-slate-500">
                      {linked.length} lié{linked.length !== 1 ? "s" : ""}
                    </p>
                  </button>

                  {/* Follow for calendar */}
                  <button onClick={() => handleToggleFollow(club.subject)}>
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
                  <button onClick={() => toggleClubExpand(club.subject)}>
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
                      onClick={() => { setLinkClubSubject(club.subject); setLinkSubjectSearch(""); }}
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={clubSearch}
              onChange={(e) => handleClubSearch(e.target.value)}
              placeholder="Ex: Paris Saint Germain, Bayern..."
              className="w-full bg-[#0f172a] border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {isSearchingClub && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}
            {!isSearchingClub && clubResults.length === 0 && clubSearch.length >= 3 && (
              <p className="text-sm text-slate-500 text-center py-6">Aucun resultat</p>
            )}
            {clubResults.map((club) => {
              const alreadyAdded = mappings.some((m) => m.api_team_id === club.id);
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

      {/* Link subject to club dialog (from club expand - shows unlinked subjects with search) */}
      <Dialog
        open={linkClubSubject !== null}
        onOpenChange={(open) => { if (!open) { setLinkClubSubject(null); setLinkSubjectSearch(""); } }}
      >
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Lier a {linkClubSubject}
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
                const targetClub = clubs.find((c) => c.subject === linkClubSubject);
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

      {/* Link unlinked subject to existing club dialog (from subject badge click) */}
      <Dialog
        open={linkUnlinkedSubject !== null}
        onOpenChange={(open) => { if (!open) setLinkUnlinkedSubject(null); }}
      >
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Lier « {linkUnlinkedSubject} »
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
