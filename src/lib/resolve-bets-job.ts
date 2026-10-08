/**
 * Job de suggestion de résultat : 2h après le coup d'envoi, récupère le score
 * football-data, écrit `suggested_result` / `fixture_score` / `resolution_status`
 * et notifie. N'écrit JAMAIS `bets.result` (confirmation = validateResult).
 *
 * Appelé par /api/cron/resolve-bets (pg_cron, 15 min) et par le bouton admin
 * « Vérifier maintenant » (ignoreDelay). Client Supabase service role requis.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveBet, type Resolution } from "./bet-resolution";
import { fetchMatch, fetchTeamFirstMatchSince, type MatchInfo } from "./football-data";
import { sendPushToUser } from "./push";
import { notificationText } from "./bet-notification";

const DELAY_MS = 2 * 3600_000;
const EXPIRY_MS = 24 * 3600_000;
const MAX_API_CALLS = 8; // quota football-data gratuit : 10 req/min
const BATCH_LIMIT = 20;

type FinalStatus = "suggested" | "postponed" | "expired";

interface JobBet {
  id: string;
  bet_number: number;
  fixture_id: number | null;
  fixture_kickoff: string | null;
  created_at: string;
  series: { user_id: string; subject: string; bet_type: string; sport: string };
}

export interface ResolveReport {
  checked: number;
  suggested: number;
  postponed: number;
  expired: number;
  manual: number;
  linked: number;
  skipped: number;
  notified: number;
  errors: string[];
}

interface Ctx {
  supabase: SupabaseClient;
  teams: Map<string, number[]>;
  notifyUsers: Set<string>;
  report: ResolveReport;
  calls: number;
}

const BET_SELECT =
  "id, bet_number, fixture_id, fixture_kickoff, created_at, series!inner(user_id, subject, bet_type, sport)";

export async function runResolveBets(
  supabase: SupabaseClient,
  opts: { ignoreDelay?: boolean; userId?: string } = {},
): Promise<ResolveReport> {
  const report: ResolveReport = {
    checked: 0, suggested: 0, postponed: 0, expired: 0, manual: 0, linked: 0, skipped: 0, notified: 0, errors: [],
  };
  const now = Date.now();
  const [due, stale, legacy] = await Promise.all([
    selectDue(supabase, now, opts),
    selectStale(supabase, now, opts.userId),
    selectLegacy(supabase, opts.userId),
  ]);
  const all = [...due, ...stale, ...legacy];
  report.checked = all.length;
  if (all.length === 0) return report;

  const ctx: Ctx = {
    supabase,
    teams: await loadTeamIds(supabase, all, report.errors),
    notifyUsers: await loadNotifyUsers(supabase, all),
    report,
    calls: 0,
  };

  for (const bet of stale) await finalize(ctx, bet, "expired", null, null);
  await resolveDue(ctx, due);
  await resolveLegacy(ctx, legacy, now, opts.ignoreDelay ?? false);
  return report;
}

// ---------- Sélections ----------

function scoped<T extends { eq: (c: string, v: string) => T }>(q: T, userId?: string): T {
  return userId ? q.eq("series.user_id", userId) : q;
}

async function selectDue(
  supabase: SupabaseClient,
  now: number,
  opts: { ignoreDelay?: boolean; userId?: string },
): Promise<JobBet[]> {
  const threshold = new Date(now - (opts.ignoreDelay ? 0 : DELAY_MS)).toISOString();
  const q = supabase
    .from("bets")
    .select(BET_SELECT)
    .is("result", null)
    .eq("resolution_status", "pending")
    .lte("fixture_kickoff", threshold)
    .gt("fixture_kickoff", new Date(now - EXPIRY_MS).toISOString())
    .order("fixture_kickoff", { ascending: true })
    .limit(BATCH_LIMIT);
  const { data } = await scoped(q, opts.userId);
  return (data ?? []) as unknown as JobBet[];
}

async function selectStale(supabase: SupabaseClient, now: number, userId?: string): Promise<JobBet[]> {
  const q = supabase
    .from("bets")
    .select(BET_SELECT)
    .is("result", null)
    .eq("resolution_status", "pending")
    .lte("fixture_kickoff", new Date(now - EXPIRY_MS).toISOString())
    .limit(BATCH_LIMIT);
  const { data } = await scoped(q, userId);
  return (data ?? []) as unknown as JobBet[];
}

/** Paris antérieurs à la feature : jamais traités (`resolution_status` null). */
async function selectLegacy(supabase: SupabaseClient, userId?: string): Promise<JobBet[]> {
  const q = supabase
    .from("bets")
    .select(BET_SELECT)
    .is("result", null)
    .is("resolution_status", null)
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);
  const { data } = await scoped(q, userId);
  return (data ?? []) as unknown as JobBet[];
}

// ---------- Contexte ----------

const teamKey = (userId: string, subject: string) => `${userId}|${subject}`;

/** (user, subject) → api_team_ids liés, clubs en premier. */
async function loadTeamIds(
  supabase: SupabaseClient,
  bets: JobBet[],
  errors: string[],
): Promise<Map<string, number[]>> {
  const userIds = [...new Set(bets.map((b) => b.series.user_id))];
  const { data, error } = await supabase
    .from("subject_links")
    .select("user_id, subject, team_mappings!inner(api_team_id, is_club)")
    .in("user_id", userIds)
    .not("team_mappings.api_team_id", "is", null);
  if (error) errors.push(`subject_links: ${error.message}`);

  const rows = (data ?? []) as unknown as {
    user_id: string;
    subject: string;
    team_mappings: { api_team_id: number; is_club: boolean };
  }[];
  rows.sort((a, b) => Number(b.team_mappings.is_club) - Number(a.team_mappings.is_club));

  const map = new Map<string, number[]>();
  for (const r of rows) {
    const key = teamKey(r.user_id, r.subject);
    map.set(key, [...(map.get(key) ?? []), r.team_mappings.api_team_id]);
  }
  return map;
}

/** Users à notifier : toggle « Résultats de paris » actif (absence de ligne = actif). */
async function loadNotifyUsers(supabase: SupabaseClient, bets: JobBet[]): Promise<Set<string>> {
  const userIds = [...new Set(bets.map((b) => b.series.user_id))];
  const { data } = await supabase
    .from("user_settings")
    .select("user_id, result_notifications_enabled")
    .in("user_id", userIds);
  const off = new Set((data ?? []).filter((s) => !s.result_notifications_enabled).map((s) => s.user_id));
  return new Set(userIds.filter((id) => !off.has(id)));
}

function teamIdFor(ctx: Ctx, bet: JobBet, match?: MatchInfo): number | null {
  const ids = ctx.teams.get(teamKey(bet.series.user_id, bet.series.subject)) ?? [];
  if (match) {
    const playing = ids.find((id) => id === match.homeTeamId || id === match.awayTeamId);
    if (playing !== undefined) return playing;
  }
  return ids[0] ?? null;
}

// ---------- Résolution ----------

async function resolveDue(ctx: Ctx, bets: JobBet[]): Promise<void> {
  const byFixture = new Map<number, JobBet[]>();
  for (const b of bets) byFixture.set(b.fixture_id!, [...(byFixture.get(b.fixture_id!) ?? []), b]);

  for (const [fixtureId, group] of byFixture) {
    if (ctx.calls >= MAX_API_CALLS) {
      ctx.report.skipped += group.length;
      continue;
    }
    ctx.calls++;
    const match = await fetchMatch(fixtureId);
    if (!match) {
      ctx.report.skipped += group.length;
      continue;
    }
    for (const bet of group) await applyResolution(ctx, bet, match);
  }
}

async function applyResolution(ctx: Ctx, bet: JobBet, match: MatchInfo): Promise<void> {
  const res: Resolution = resolveBet({
    betType: bet.series.bet_type,
    teamId: teamIdFor(ctx, bet, match),
    match,
  });
  if (res.status === "pending") {
    ctx.report.skipped++;
    return;
  }
  await finalize(ctx, bet, res.status, res.suggested, res.score);
}

async function resolveLegacy(ctx: Ctx, bets: JobBet[], now: number, ignoreDelay: boolean): Promise<void> {
  for (const bet of bets) {
    const teamId = bet.series.sport === "football" ? teamIdFor(ctx, bet) : null;
    if (teamId === null) {
      await setStatus(ctx, bet.id, { resolution_status: "manual" });
      ctx.report.manual++;
      continue;
    }
    if (ctx.calls >= MAX_API_CALLS) {
      ctx.report.skipped++;
      continue;
    }
    ctx.calls++;
    const match = await fetchTeamFirstMatchSince(teamId, new Date(bet.created_at));
    if (match === undefined) ctx.report.skipped++;
    else await linkLegacy(ctx, bet, match, now, ignoreDelay);
  }
}

/** Rattache un pari historique à son match puis le résout si l'heure est passée. */
async function linkLegacy(
  ctx: Ctx,
  bet: JobBet,
  match: MatchInfo | null,
  now: number,
  ignoreDelay: boolean,
): Promise<void> {
  if (!match) {
    await setStatus(ctx, bet.id, { resolution_status: "manual" });
    ctx.report.manual++;
    return;
  }
  await setStatus(ctx, bet.id, {
    fixture_id: match.id,
    fixture_kickoff: match.utcDate,
    resolution_status: "pending",
  });
  ctx.report.linked++;
  const kickoff = new Date(match.utcDate).getTime();
  if (kickoff <= now - (ignoreDelay ? 0 : DELAY_MS)) await applyResolution(ctx, bet, match);
}

async function setStatus(ctx: Ctx, betId: string, patch: Record<string, unknown>): Promise<boolean> {
  const { error } = await ctx.supabase.from("bets").update(patch).eq("id", betId).is("result", null);
  if (error) ctx.report.errors.push(`bet ${betId}: ${error.message}`);
  return !error;
}

async function finalize(
  ctx: Ctx,
  bet: JobBet,
  status: FinalStatus,
  suggested: "gagne" | "perdu" | null,
  score: string | null,
): Promise<void> {
  const ok = await setStatus(ctx, bet.id, {
    resolution_status: status,
    suggested_result: suggested,
    fixture_score: score,
  });
  if (!ok) return;
  ctx.report[status]++;
  if (!ctx.notifyUsers.has(bet.series.user_id)) return;

  const res = await sendPushToUser(ctx.supabase, bet.series.user_id, {
    ...notificationText({ subject: bet.series.subject, betNumber: bet.bet_number, status, suggested, score }),
    url: "/",
    tag: `bet-${bet.id}`,
  });
  ctx.report.notified += res.sent;
  ctx.report.errors.push(...res.errors);
}
