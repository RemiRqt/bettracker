/**
 * Rapprochement match football-data ↔ événement The Odds API et extraction
 * des cotes de l'issue pariée. Pur — testé dans odds-matching.test.ts.
 */

export interface OddsEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    markets: { key: string; outcomes: { name: string; price: number }[] }[];
  }[];
}

export interface OddsSummary {
  best: number;
  avg: number;
  bestBookmaker: string;
  detail: Record<string, number>;
}

const STOP_WORDS = new Set(["fc", "cf", "sc", "ac", "afc", "rc", "as", "club", "de", "the", "cd", "ud", "ss"]);
const MAX_KICKOFF_GAP_MS = 2 * 3600_000;

export function normalizeTeamName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && !STOP_WORDS.has(w))
    .join(" ");
}

/** Égalité normalisée, ou inclusion en mots entiers si la plus courte fait ≥ 2 mots. */
export function sameTeam(a: string, b: string): boolean {
  const x = normalizeTeamName(a);
  const y = normalizeTeamName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  if (short.split(" ").length < 2) return false;
  return ` ${long} `.includes(` ${short} `);
}

const matchesAny = (name: string, candidates: string[]) => candidates.some((c) => sameTeam(name, c));

export function findEvent(
  events: OddsEvent[],
  target: { kickoff: string; homeNames: string[]; awayNames: string[] },
): OddsEvent | null {
  const t = new Date(target.kickoff).getTime();
  const near = events.filter((e) => Math.abs(new Date(e.commence_time).getTime() - t) <= MAX_KICKOFF_GAP_MS);
  const scored = near
    .map((e) => ({
      e,
      score:
        Number(matchesAny(e.home_team, target.homeNames)) + Number(matchesAny(e.away_team, target.awayNames)),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.e ?? null;
}

/** Cotes par bookmaker pour l'issue pariée. `side` = côté de l'équipe pariée. */
export function outcomePrices(
  event: OddsEvent,
  side: "home" | "away",
  betType: string,
): Record<string, number> | null {
  if (betType !== "victoire" && betType !== "defaite") return null;
  const teamSide = betType === "victoire" ? side : side === "home" ? "away" : "home";
  const outcomeName = teamSide === "home" ? event.home_team : event.away_team;

  const prices: Record<string, number> = {};
  for (const b of event.bookmakers) {
    const h2h = b.markets.find((m) => m.key === "h2h");
    const o = h2h?.outcomes.find((x) => x.name === outcomeName);
    if (o) prices[b.key] = o.price;
  }
  return prices;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Meilleure cote / moyenne limitées aux bookmakers cochés. `null` si aucun dispo. */
export function summarize(prices: Record<string, number>, allowed: string[]): OddsSummary | null {
  const detail: Record<string, number> = {};
  for (const k of allowed) if (typeof prices[k] === "number" && prices[k] > 1) detail[k] = prices[k];
  const entries = Object.entries(detail);
  if (entries.length === 0) return null;
  const [bestBookmaker, best] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  const avg = round2(entries.reduce((s, [, p]) => s + p, 0) / entries.length);
  return { best, avg, bestBookmaker, detail };
}

export interface OutcomeBest {
  price: number;
  bookmaker: string;
}

/** Meilleure cote (et bookmaker) pour 1 / N / 2, limitée aux bookmakers cochés. */
export function bestPerOutcome(
  event: OddsEvent,
  allowed: string[],
): { home: OutcomeBest | null; draw: OutcomeBest | null; away: OutcomeBest | null } | null {
  const names = { home: event.home_team, draw: "Draw", away: event.away_team };
  const best: Record<keyof typeof names, OutcomeBest | null> = { home: null, draw: null, away: null };
  for (const b of event.bookmakers) {
    if (!allowed.includes(b.key)) continue;
    const outcomes = b.markets.find((m) => m.key === "h2h")?.outcomes ?? [];
    for (const side of ["home", "draw", "away"] as const) {
      const o = outcomes.find((x) => x.name === names[side]);
      if (o && (!best[side] || o.price > best[side]!.price)) best[side] = { price: o.price, bookmaker: b.key };
    }
  }
  return best.home || best.draw || best.away ? best : null;
}
