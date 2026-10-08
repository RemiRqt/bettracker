/**
 * Résolution pure d'un pari à partir du résultat d'un match football-data.
 * Aucun accès réseau ni DB — testé dans bet-resolution.test.ts.
 */

export interface MatchResult {
  status: string;
  homeTeamId: number;
  awayTeamId: number;
  fullTime: { home: number | null; away: number | null };
}

export type ResolutionStatus = "pending" | "suggested" | "postponed";

export interface Resolution {
  status: ResolutionStatus;
  suggested: "gagne" | "perdu" | null;
  score: string | null;
}

const POSTPONED_STATUSES = new Set(["POSTPONED", "SUSPENDED", "CANCELLED"]);

const PENDING: Resolution = { status: "pending", suggested: null, score: null };

type Outcome = "win" | "draw" | "loss";

function teamOutcome(teamId: number | null, m: MatchResult, home: number, away: number): Outcome | null {
  if (teamId === m.homeTeamId) return home > away ? "win" : home < away ? "loss" : "draw";
  if (teamId === m.awayTeamId) return away > home ? "win" : away < home ? "loss" : "draw";
  return null;
}

function suggestFor(betType: string, outcome: Outcome | null): "gagne" | "perdu" | null {
  if (!outcome) return null;
  if (betType === "victoire") return outcome === "win" ? "gagne" : "perdu";
  if (betType === "defaite") return outcome === "loss" ? "gagne" : "perdu";
  return null;
}

export function resolveBet(input: {
  betType: string;
  teamId: number | null;
  match: MatchResult;
}): Resolution {
  const { betType, teamId, match } = input;

  if (POSTPONED_STATUSES.has(match.status)) {
    return { status: "postponed", suggested: null, score: null };
  }

  const { home, away } = match.fullTime;
  if (match.status !== "FINISHED" || home === null || away === null) return PENDING;

  const outcome = teamOutcome(teamId, match, home, away);
  return { status: "suggested", suggested: suggestFor(betType, outcome), score: `${home}-${away}` };
}
