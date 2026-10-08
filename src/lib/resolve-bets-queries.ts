/** Sélections des paris à traiter par le job de suggestion de résultat. */

import type { SupabaseClient } from "@supabase/supabase-js";

export const DELAY_MS = 2 * 3600_000;
export const EXPIRY_MS = 24 * 3600_000;
const BATCH_LIMIT = 20;

export interface JobBet {
  id: string;
  bet_number: number;
  fixture_id: number | null;
  fixture_kickoff: string | null;
  created_at: string;
  series: { user_id: string; subject: string; bet_type: string; sport: string };
}

const BET_SELECT =
  "id, bet_number, fixture_id, fixture_kickoff, created_at, series!inner(user_id, subject, bet_type, sport)";

function scoped<T extends { eq: (c: string, v: string) => T }>(q: T, userId?: string): T {
  return userId ? q.eq("series.user_id", userId) : q;
}

export async function selectDue(
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

export async function selectStale(supabase: SupabaseClient, now: number, userId?: string): Promise<JobBet[]> {
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
export async function selectLegacy(supabase: SupabaseClient, userId?: string): Promise<JobBet[]> {
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
