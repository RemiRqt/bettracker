"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import {
  toggleFollow,
  linkTeamToApi,
  updateMatchesCount,
  upsertTeamMapping,
} from "@/actions/teams";
import type { TeamMapping } from "@/actions/teams";
import { TeamLogo } from "@/components/ui/team-logo";
import { SPORT_EMOJIS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Star, Link2, Search, Loader2, Plus, X, ChevronDown, ChevronRight } from "lucide-react";
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

  // Link subject dialog (from club expand)
  const [linkSubject, setLinkSubject] = useState<string | null>(null);
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());

  // Link subject via API search dialog
  const [linkSearchSubject, setLinkSearchSubject] = useState<string | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [linkSearchResults, setLinkSearchResults] = useState<ApiTeamResult[]>([]);
  const [isSearchingLink, setIsSearchingLink] = useState(false);
  const linkSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get clubs (entries with api_team_id) and unlinked subjects
  const clubs = mappings.filter((m) => m.api_team_id !== null && m.is_followed);
  const subjects = mappings.filter((m) => m.api_team_id === null);
  const linkedSubjects = mappings.filter((m) => m.api_team_id !== null && !m.is_followed);

  // Search API-Football
  const handleClubSearch = useCallback((query: string) => {
    setClubSearch(query);
    if (clubSearchTimeout.current) clearTimeout(clubSearchTimeout.current);

    if (query.trim().length < 3) {
      setClubResults([]);
      return;
    }

    clubSearchTimeout.current = setTimeout(async () => {
      setIsSearchingClub(true);
      try {
        const res = await fetch(`/api/football/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setClubResults(Array.isArray(data) ? data : []);
        }
      } catch {
        setClubResults([]);
      } finally {
        setIsSearchingClub(false);
      }
    }, 500);
  }, []);

  // Add a club as favorite
  const handleAddClub = useCallback((club: ApiTeamResult) => {
    // Check if already exists by api_team_id
    const existingByApi = mappings.find((m) => m.api_team_id === club.id);
    if (existingByApi) {
      // Just follow it
      if (!existingByApi.is_followed) {
        setMappings((prev) =>
          prev.map((m) => m.api_team_id === club.id ? { ...m, is_followed: true } : m)
        );
        startTransition(async () => {
          await toggleFollow(existingByApi.subject);
        });
      }
      setAddClubOpen(false);
      setClubSearch("");
      setClubResults([]);
      return;
    }

    // Check if a mapping with the same subject name already exists (from series)
    const existingByName = mappings.find((m) => m.subject === club.name);
    if (existingByName) {
      // Update existing mapping in place instead of creating a duplicate
      setMappings((prev) =>
        prev.map((m) =>
          m.subject === club.name
            ? { ...m, api_team_id: club.id, logo_url: club.logo, is_followed: true }
            : m
        )
      );
      startTransition(async () => {
        await upsertTeamMapping(club.name, {
          api_team_id: club.id,
          logo_url: club.logo,
          sport: "football",
          is_followed: true,
        });
      });
      setAddClubOpen(false);
      setClubSearch("");
      setClubResults([]);
      return;
    }

    // Create new mapping for truly new clubs
    const newMapping: TeamMapping = {
      id: crypto.randomUUID(),
      user_id: "",
      subject: club.name,
      sport: "football",
      api_team_id: club.id,
      logo_url: club.logo,
      is_followed: true,
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
        is_followed: true,
      });
    });

    setAddClubOpen(false);
    setClubSearch("");
    setClubResults([]);
  }, [mappings]);

  // Unfollow club
  const handleUnfollow = useCallback((subject: string) => {
    setMappings((prev) =>
      prev.map((m) => m.subject === subject ? { ...m, is_followed: false } : m)
    );
    startTransition(async () => {
      await toggleFollow(subject);
    });
  }, []);

  // Link a subject to a club
  const handleLinkSubjectToClub = useCallback((subjectName: string, club: TeamMapping) => {
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
    setLinkSubject(null);
  }, []);

  // Unlink a subject
  const handleUnlinkSubject = useCallback((subjectName: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.subject === subjectName
          ? { ...m, api_team_id: null, logo_url: null, is_followed: false }
          : m
      )
    );
    startTransition(async () => {
      await linkTeamToApi(subjectName, 0, "");
    });
  }, []);

  // Update matches count
  const handleMatchesCount = useCallback((subject: string, count: number) => {
    setMappings((prev) =>
      prev.map((m) => m.subject === subject ? { ...m, next_matches_count: count } : m)
    );
    startTransition(async () => {
      await updateMatchesCount(subject, count);
    });
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

  // Search API for linking a subject
  const handleLinkSearch = useCallback((query: string) => {
    setLinkSearchQuery(query);
    if (linkSearchTimeout.current) clearTimeout(linkSearchTimeout.current);

    if (query.trim().length < 3) {
      setLinkSearchResults([]);
      return;
    }

    linkSearchTimeout.current = setTimeout(async () => {
      setIsSearchingLink(true);
      try {
        const res = await fetch(`/api/football/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setLinkSearchResults(Array.isArray(data) ? data : []);
        }
      } catch {
        setLinkSearchResults([]);
      } finally {
        setIsSearchingLink(false);
      }
    }, 500);
  }, []);

  // Link a subject to an API team via search
  const handleLinkSubjectToApiTeam = useCallback((subjectName: string, apiTeam: ApiTeamResult) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.subject === subjectName
          ? { ...m, api_team_id: apiTeam.id, logo_url: apiTeam.logo }
          : m
      )
    );
    startTransition(async () => {
      await linkTeamToApi(subjectName, apiTeam.id, apiTeam.logo);
    });
    setLinkSearchSubject(null);
    setLinkSearchQuery("");
    setLinkSearchResults([]);
  }, []);

  // Open link search dialog with subject name pre-filled
  const openLinkSearch = useCallback((subject: string) => {
    setLinkSearchSubject(subject);
    setLinkSearchQuery("");
    setLinkSearchResults([]);
  }, []);

  // Get subjects linked to a specific club
  const getLinkedSubjects = useCallback((clubApiId: number) => {
    return mappings.filter((m) => m.api_team_id === clubApiId && !m.is_followed);
  }, [mappings]);

  return (
    <div className="space-y-4">
      {/* Add club button */}
      <button
        onClick={() => setAddClubOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-600 text-sm text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Ajouter un club
      </button>

      {/* Followed clubs */}
      {clubs.length > 0 && (
        <div className="space-y-2">
          {clubs.map((club) => {
            const isExpanded = expandedClubs.has(club.subject);
            const linked = getLinkedSubjects(club.api_team_id!);

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
                      {linked.length} joueur{linked.length !== 1 ? "s" : ""} lié{linked.length !== 1 ? "s" : ""}
                    </p>
                  </button>

                  {/* Matches count */}
                  <div className="flex items-center gap-0.5">
                    {[2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => handleMatchesCount(club.subject, n)}
                        className={cn(
                          "h-6 w-6 rounded text-xs font-medium transition-colors",
                          club.next_matches_count === n
                            ? "bg-[#10b981] text-white"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  {/* Expand */}
                  <button onClick={() => toggleClubExpand(club.subject)}>
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-slate-500" />
                      : <ChevronRight className="h-4 w-4 text-slate-500" />
                    }
                  </button>

                  {/* Unfollow */}
                  <button onClick={() => handleUnfollow(club.subject)}>
                    <X className="h-4 w-4 text-slate-600 hover:text-red-400 transition-colors" />
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
                      onClick={() => setLinkSubject(club.subject)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-slate-700 text-xs text-slate-500 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      <Link2 className="h-3 w-3" />
                      Lier un joueur/équipe
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
            Non liés ({subjects.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => openLinkSearch(s.subject)}
                className="px-2.5 py-1 rounded-full bg-[#0f172a] text-xs text-slate-400 border border-slate-700/50 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <Link2 className="h-3 w-3 inline mr-1" />
                {s.subject}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add club dialog */}
      <Dialog open={addClubOpen} onOpenChange={setAddClubOpen}>
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Ajouter un club</DialogTitle>
            <DialogDescription className="text-slate-400">
              Recherchez un club pour suivre son calendrier
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
              <p className="text-sm text-slate-500 text-center py-6">
                Aucun résultat
              </p>
            )}

            {clubResults.map((club) => {
              const alreadyAdded = mappings.some((m) => m.api_team_id === club.id && m.is_followed);
              return (
                <button
                  key={club.id}
                  onClick={() => handleAddClub(club)}
                  disabled={alreadyAdded}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors",
                    alreadyAdded
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#0f172a]"
                  )}
                >
                  <img src={club.logo} alt="" className="h-8 w-8 object-contain" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{club.name}</p>
                    {club.country && (
                      <p className="text-xs text-slate-500">{club.country}</p>
                    )}
                  </div>
                  {alreadyAdded && (
                    <span className="text-xs text-emerald-400">Ajouté</span>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Link subject to club dialog (from club expand) */}
      <Dialog
        open={linkSubject !== null}
        onOpenChange={(open) => { if (!open) setLinkSubject(null); }}
      >
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Lier à {linkSubject}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Choisissez un joueur ou équipe à associer
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {subjects.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                Tous les joueurs/équipes sont déjà liés
              </p>
            ) : (
              subjects.map((s) => {
                const targetClub = clubs.find((c) => c.subject === linkSubject);
                if (!targetClub) return null;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleLinkSubjectToClub(s.subject, targetClub)}
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

      {/* Link subject via API search dialog */}
      <Dialog
        open={linkSearchSubject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLinkSearchSubject(null);
            setLinkSearchQuery("");
            setLinkSearchResults([]);
          }
        }}
      >
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Lier « {linkSearchSubject} »
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Recherchez l&apos;equipe API correspondante
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={linkSearchQuery}
              onChange={(e) => handleLinkSearch(e.target.value)}
              placeholder={`Ex: ${linkSearchSubject}...`}
              className="w-full bg-[#0f172a] border border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1">
            {isSearchingLink && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}

            {!isSearchingLink && linkSearchResults.length === 0 && linkSearchQuery.length >= 3 && (
              <p className="text-sm text-slate-500 text-center py-6">
                Aucun résultat
              </p>
            )}

            {linkSearchResults.map((team) => (
              <button
                key={team.id}
                onClick={() => handleLinkSubjectToApiTeam(linkSearchSubject!, team)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#0f172a] transition-colors text-left"
              >
                <img src={team.logo} alt="" className="h-8 w-8 object-contain" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{team.name}</p>
                  {team.country && (
                    <p className="text-xs text-slate-500">{team.country}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
