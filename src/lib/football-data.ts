/**
 * Client football-data.org v4 (server only).
 * Offre gratuite : 10 req/min — les appelants doivent limiter le volume.
 */

import type { MatchResult } from "./bet-resolution";

const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";
const TIMEOUT_MS = 8000;

export interface CachedFixture {
  id: number;
  date: string;
  homeTeam: string;
  homeLogo: string;
  awayTeam: string;
  awayLogo: string;
  league: string;
  leagueLogo: string;
}

interface ApiTeam {
  id: number;
  name: string;
  shortName: string;
  crest: string;
}

interface ApiMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  competition: { name: string; emblem: string };
  score?: { fullTime?: { home: number | null; away: number | null } };
}

export interface MatchInfo extends MatchResult {
  id: number;
  utcDate: string;
}

async function apiGet<T>(path: string): Promise<T | null> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    console.error("[football-data] FOOTBALL_DATA_API_KEY is not set");
    return null;
  }
  try {
    const res = await fetch(`${FOOTBALL_DATA_BASE}${path}`, {
      headers: { "X-Auth-Token": apiKey },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[football-data] ${res.status} on ${path}:`, await res.text());
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error(`[football-data] request failed on ${path}:`, error);
    return null;
  }
}

function toCachedFixture(m: ApiMatch): CachedFixture {
  return {
    id: m.id,
    date: m.utcDate,
    homeTeam: m.homeTeam.shortName || m.homeTeam.name,
    homeLogo: m.homeTeam.crest || "",
    awayTeam: m.awayTeam.shortName || m.awayTeam.name,
    awayLogo: m.awayTeam.crest || "",
    league: m.competition.name,
    leagueLogo: m.competition.emblem || "",
  };
}

function toMatchResult(m: ApiMatch): MatchInfo {
  return {
    id: m.id,
    utcDate: m.utcDate,
    status: m.status,
    homeTeamId: m.homeTeam.id,
    awayTeamId: m.awayTeam.id,
    fullTime: {
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null,
    },
  };
}

/** Prochains matchs programmés d'une équipe. `[]` en cas d'erreur. */
export async function fetchTeamFixtures(teamId: number, limit: number): Promise<CachedFixture[]> {
  const json = await apiGet<{ matches?: ApiMatch[] }>(
    `/teams/${teamId}/matches?status=SCHEDULED&limit=${limit}`,
  );
  return (json?.matches ?? []).map(toCachedFixture);
}

/** Un match par son id. `null` en cas d'erreur (à réessayer plus tard). */
export async function fetchMatch(matchId: number): Promise<MatchInfo | null> {
  const json = await apiGet<ApiMatch>(`/matches/${matchId}`);
  return json ? toMatchResult(json) : null;
}

/**
 * Premier match d'une équipe (tous statuts) dans les 10 jours suivant
 * `dateFrom` — secours pour les paris créés sans match rattaché.
 * `undefined` = erreur API, `null` = aucun match sur la fenêtre.
 */
export async function fetchTeamFirstMatchSince(
  teamId: number,
  dateFrom: Date,
): Promise<MatchInfo | null | undefined> {
  const from = dateFrom.toISOString().slice(0, 10);
  const to = new Date(dateFrom.getTime() + 10 * 86_400_000).toISOString().slice(0, 10);
  const json = await apiGet<{ matches?: ApiMatch[] }>(
    `/teams/${teamId}/matches?dateFrom=${from}&dateTo=${to}`,
  );
  if (!json) return undefined;
  const after = (json.matches ?? [])
    .filter((m) => new Date(m.utcDate).getTime() >= dateFrom.getTime())
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  return after.length > 0 ? toMatchResult(after[0]) : null;
}
