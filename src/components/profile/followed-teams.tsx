"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
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
import { Star, Link2, Search, Loader2 } from "lucide-react";

interface FollowedTeamsProps {
  teamMappings: TeamMapping[];
}

interface SearchResult {
  id: number;
  name: string;
  country: string | null;
  logo: string;
}

export function FollowedTeams({ teamMappings: initialMappings }: FollowedTeamsProps) {
  const [mappings, setMappings] = useState(initialMappings);
  const [, startTransition] = useTransition();
  const [linkingSubject, setLinkingSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with server state on prop change
  useEffect(() => {
    setMappings(initialMappings);
  }, [initialMappings]);

  const handleToggleFollow = useCallback(
    (subject: string, currentlyFollowed: boolean) => {
      // Optimistic update
      setMappings((prev) =>
        prev.map((m) =>
          m.subject === subject ? { ...m, is_followed: !currentlyFollowed } : m
        )
      );

      startTransition(async () => {
        const result = await toggleFollow(subject);
        if (result?.error) {
          // Revert on error
          setMappings((prev) =>
            prev.map((m) =>
              m.subject === subject ? { ...m, is_followed: currentlyFollowed } : m
            )
          );
        }
      });
    },
    []
  );

  const handleMatchesCount = useCallback((subject: string, count: number) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.subject === subject ? { ...m, next_matches_count: count } : m
      )
    );

    startTransition(async () => {
      await updateMatchesCount(subject, count);
    });
  }, []);

  const handleSportChange = useCallback((subject: string, sport: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.subject === subject ? { ...m, sport } : m))
    );

    startTransition(async () => {
      await upsertTeamMapping(subject, { sport });
    });
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/football/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, []);

  const handleLinkTeam = useCallback(
    (apiTeamId: number, logoUrl: string | null) => {
      if (!linkingSubject) return;

      setMappings((prev) =>
        prev.map((m) =>
          m.subject === linkingSubject
            ? { ...m, api_team_id: apiTeamId, logo_url: logoUrl }
            : m
        )
      );

      startTransition(async () => {
        await linkTeamToApi(linkingSubject, apiTeamId, logoUrl || "");
      });

      setLinkingSubject(null);
      setSearchQuery("");
      setSearchResults([]);
    },
    [linkingSubject]
  );

  const followedTeams = mappings.filter((m) => m.is_followed);
  const unfollowedTeams = mappings.filter((m) => !m.is_followed);
  const linkingTeam = mappings.find((m) => m.subject === linkingSubject);

  return (
    <div className="space-y-4">
      {/* Followed teams */}
      {followedTeams.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Suivies
          </p>
          {followedTeams.map((team) => (
            <TeamRow
              key={team.id}
              team={team}
              onToggleFollow={handleToggleFollow}
              onMatchesCount={handleMatchesCount}
              onLink={() => {
                setLinkingSubject(team.subject);
                setSearchQuery("");
                setSearchResults([]);
              }}
            />
          ))}
        </div>
      )}

      {/* Unfollowed teams */}
      {unfollowedTeams.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            Non suivies
          </p>
          {unfollowedTeams.map((team) => (
            <TeamRow
              key={team.id}
              team={team}
              onToggleFollow={handleToggleFollow}
              onMatchesCount={handleMatchesCount}
              onLink={() => {
                setLinkingSubject(team.subject);
                setSearchQuery("");
                setSearchResults([]);
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {mappings.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">
          Aucune equipe trouvee. Creez une serie pour commencer.
        </p>
      )}

      {/* Link team dialog */}
      <Dialog
        open={linkingSubject !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLinkingSubject(null);
            setSearchQuery("");
            setSearchResults([]);
          }
        }}
      >
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-[family-name:var(--font-poppins)]">
              Lier &laquo; {linkingTeam?.subject} &raquo; a API-Football
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Recherchez l&apos;equipe pour la lier et afficher ses matchs.
            </DialogDescription>
          </DialogHeader>

          {/* Sport selector */}
          {linkingTeam && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Sport :</p>
              <div className="flex gap-2">
                {Object.entries(SPORT_EMOJIS)
                  .filter(([key]) => key !== "default")
                  .map(([key, emoji]) => (
                    <button
                      key={key}
                      onClick={() => handleSportChange(linkingTeam.subject, key)}
                      className={`h-9 w-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                        linkingTeam.sport === key
                          ? "bg-[#10b981] bg-opacity-20 ring-1 ring-[#10b981]"
                          : "bg-[#0f172a] hover:bg-slate-700"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher une equipe..."
              className="w-full bg-[#0f172a] border border-slate-600 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#10b981]"
              autoFocus
            />
          </div>

          {/* Search results */}
          <div className="max-h-60 overflow-y-auto space-y-1">
            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}

            {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
              <p className="text-sm text-slate-500 text-center py-4">
                Aucun resultat trouve.
              </p>
            )}

            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() =>
                  handleLinkTeam(result.id, result.logo || null)
                }
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#0f172a] transition-colors text-left"
              >
                <TeamLogo logoUrl={result.logo} size="md" />
                <div>
                  <span className="text-sm text-white">{result.name}</span>
                  {result.country && (
                    <span className="text-xs text-slate-500 ml-2">{result.country}</span>
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

// --- Team Row Component ---

interface TeamRowProps {
  team: TeamMapping;
  onToggleFollow: (subject: string, currentlyFollowed: boolean) => void;
  onMatchesCount: (subject: string, count: number) => void;
  onLink: () => void;
}

function TeamRow({
  team,
  onToggleFollow,
  onMatchesCount,
  onLink,
}: TeamRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[#0f172a] p-3">
      {/* Logo / Emoji */}
      <TeamLogo logoUrl={team.logo_url} sport={team.sport} size="md" />

      {/* Name + link button */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{team.subject}</p>
        {!team.api_team_id && (
          <button
            onClick={onLink}
            className="flex items-center gap-1 text-xs text-[#10b981] hover:text-emerald-300 transition-colors mt-0.5"
          >
            <Link2 className="h-3 w-3" />
            Lier
          </button>
        )}
      </div>

      {/* Matches count selector (only for followed + linked teams) */}
      {team.is_followed && team.api_team_id && (
        <div className="flex items-center gap-0.5">
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onMatchesCount(team.subject, n)}
              className={`h-6 w-6 rounded text-xs font-medium transition-colors ${
                team.next_matches_count === n
                  ? "bg-[#10b981] text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* Follow star toggle */}
      <button
        onClick={() => onToggleFollow(team.subject, team.is_followed)}
        className="flex-shrink-0"
      >
        <Star
          className={`h-5 w-5 transition-colors ${
            team.is_followed
              ? "fill-yellow-400 text-yellow-400"
              : "text-slate-600 hover:text-slate-400"
          }`}
        />
      </button>
    </div>
  );
}
