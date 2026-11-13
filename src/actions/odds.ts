"use server";

import { createClient, getAuthUser } from "@/lib/supabase/server";
import { BOOKMAKER_KEYS, SPORT_KEYS, getLeagueOdds } from "@/lib/odds-api";
import { findEvent, outcomePrices, summarize, type OddsSummary } from "@/lib/odds-matching";
import { createServiceClient } from "@/lib/supabase/service";

export interface MarketOddsInput {
  competitionCode: string | null;
  kickoff: string;
  teamId: number;
  homeTeamId: number;
  homeNames: string[];
  awayNames: string[];
  betType: string;
}

export type MarketOddsResult = (OddsSummary & { prices: Record<string, number> }) | { unavailable: true } | null;

/**
 * Cotes du marché pour l'issue pariée, limitées aux bookmakers cochés du user.
 * `null` = pas de cotes possibles (championnat non couvert, type non coté, match introuvable).
 */
export async function getMarketOdds(input: MarketOddsInput): Promise<MarketOddsResult> {
  const sportKey = input.competitionCode ? SPORT_KEYS[input.competitionCode] : undefined;
  if (!sportKey || (input.betType !== "victoire" && input.betType !== "defaite")) return null;

  const supabase = await createClient();
  const { user } = await getAuthUser();
  if (!user) return null;

  const { data: settings } = await supabase.from("user_settings").select("bookmakers").eq("user_id", user.id).maybeSingle();
  const allowed = settings?.bookmakers ?? BOOKMAKER_KEYS;

  const service = createServiceClient();
  const events = await getLeagueOdds(service, sportKey);
  if (!events) return { unavailable: true };

  const event = findEvent(events, input);
  if (!event) return null;
  const side = input.teamId === input.homeTeamId ? "home" : "away";
  const prices = outcomePrices(event, side, input.betType);
  const summary = prices ? summarize(prices, allowed) : null;
  if (!summary) return { unavailable: true };
  return { ...summary, prices: summary.detail };
}
