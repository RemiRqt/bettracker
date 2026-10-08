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
import {
  DELAY_MS,
  selectDue,
  selectLegacy,
  selectStale,
  type JobBet,
} from "./resolve-bets-queries";
import { notificationText } from "./bet-notification";

const MAX_API_CALLS = 8; // quota football-data gratuit : 10 req/min

type FinalStatus = "suggested" | "postponed" | "expired";

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
    const ids =
      bet.series.sport === "football"
        ? ctx.teams.get(teamKey(bet.series.user_id, bet.series.subject)) ?? []
        : [];
    if (ids.length === 0) {
      await setStatus(ctx, bet.id, { resolution_status: "manual" });
      ctx.report.manual++;
      continue;
    }
    if (ctx.calls + ids.length > MAX_API_CALLS) {
      ctx.report.skipped++;
      continue;
    }
    const match = await firstMatchAcross(ctx, ids, new Date(bet.created_at));
    if (match === undefined) ctx.report.skipped++;
    else await linkLegacy(ctx, bet, match, now, ignoreDelay);
  }
}

/**
 * Un sujet peut être lié à plusieurs équipes (joueur : club + sélection) →
 * on garde le match le plus proche après la création du pari.
 * `undefined` si une erreur API empêche de conclure.
 */
async function firstMatchAcross(ctx: Ctx, ids: number[], since: Date): Promise<MatchInfo | null | undefined> {
  ctx.calls += ids.length;
  const results = await Promise.all(ids.map((id) => fetchTeamFirstMatchSince(id, since)));
  const found = results.filter((m): m is MatchInfo => !!m).sort((x, y) => x.utcDate.localeCompare(y.utcDate));
  if (found.length > 0) return found[0];
  return results.some((m) => m === undefined) ? undefined : null;
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
