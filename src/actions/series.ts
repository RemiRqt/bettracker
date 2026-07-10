"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  getSubjectLinks,
  getTeamMappings,
  type CachedFixture,
  type TeamMapping,
} from "@/actions/teams";
import type { ActionItem, BetType, SportType } from "@/lib/types";

/**
 * Active series that need attention on the dashboard.
 * Each item carries its logo + next match date, and its pending bet (if any).
 * The UI shows the pending bet directly, else the série + "Parier" button.
 */
export async function getActionItems(): Promise<ActionItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const [{ data: series, error: seriesError }, links, mappings] =
    await Promise.all([
      supabase
        .from("series")
        .select(
          "id, subject, bet_type, sport, target_gain, created_at, bets(id, bet_number, odds, stake, result)"
        )
        .eq("user_id", user.id)
        .eq("status", "en_cours")
        .order("created_at", { ascending: false })
        .limit(50),
      getSubjectLinks(),
      getTeamMappings(),
    ]);

  if (seriesError) {
    throw new Error(
      `Erreur lors de la recuperation des series: ${seriesError.message}`
    );
  }

  // subject → TeamMapping[] via subject_links
  const byId = new Map(mappings.map((m) => [m.id, m]));
  const entitiesBySubject = new Map<string, TeamMapping[]>();
  for (const l of links) {
    const ent = byId.get(l.team_mapping_id);
    if (!ent) continue;
    const arr = entitiesBySubject.get(l.subject) ?? [];
    arr.push(ent);
    entitiesBySubject.set(l.subject, arr);
  }

  const nowMs = Date.now();

  const items: ActionItem[] = (series ?? []).map((s) => {
    const entities = entitiesBySubject.get(s.subject) ?? [];
    const logoUrl = entities[0]?.logo_url ?? null;

    let nextMatchDate: string | null = null;
    for (const ent of entities) {
      const fixtures = (ent.cached_fixtures ?? []) as CachedFixture[];
      for (const f of fixtures) {
        if (
          new Date(f.date).getTime() > nowMs &&
          (!nextMatchDate || f.date < nextMatchDate)
        ) {
          nextMatchDate = f.date;
        }
      }
    }

    const pending = (s.bets ?? []).find((b) => b.result === null) ?? null;

    return {
      seriesId: s.id,
      subject: s.subject,
      betType: s.bet_type as BetType,
      sport: s.sport as SportType,
      targetGain: s.target_gain,
      logoUrl,
      nextMatchDate,
      pendingBet: pending
        ? {
            id: pending.id,
            betNumber: pending.bet_number,
            odds: pending.odds,
            stake: pending.stake,
          }
        : null,
    };
  });

  // Soonest next match first (undated last); pending bets ahead of ties.
  items.sort((a, b) => {
    const at = a.nextMatchDate ? new Date(a.nextMatchDate).getTime() : Infinity;
    const bt = b.nextMatchDate ? new Date(b.nextMatchDate).getTime() : Infinity;
    if (at !== bt) return at - bt;
    return (a.pendingBet ? 0 : 1) - (b.pendingBet ? 0 : 1);
  });

  return items;
}
export async function abandonSeries(seriesId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  // Update the series status to abandoned (RLS ensures ownership)
  const { error: seriesError } = await supabase
    .from("series")
    .update({ status: "abandonnee" })
    .eq("id", seriesId);

  if (seriesError) {
    return { error: `Erreur lors de l'abandon de la serie: ${seriesError.message}` };
  }

  // Mark any pending bets (result is null) in this series as lost
  const { error: betsError } = await supabase
    .from("bets")
    .update({ result: "perdu" })
    .eq("series_id", seriesId)
    .is("result", null);

  if (betsError) {
    return { error: `Erreur lors de la mise a jour des paris: ${betsError.message}` };
  }

  revalidatePath(`/series/${seriesId}`);
  revalidatePath("/series");

  return { success: true };
}

export async function reopenSeries(seriesId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("id, status")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) {
    return { error: "Serie introuvable." };
  }

  if (series.status !== "abandonnee") {
    return { error: "Seule une serie abandonnee peut etre rouverte." };
  }

  const { error } = await supabase
    .from("series")
    .update({ status: "en_cours" })
    .eq("id", seriesId);

  if (error) {
    return { error: `Erreur lors de la reouverture de la serie: ${error.message}` };
  }

  revalidatePath(`/series/${seriesId}`);
  revalidatePath("/series");
  revalidatePath("/");

  return { success: true };
}

export async function deleteSeries(seriesId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Vous devez etre connecte.");
  }

  // Verify the series belongs to the user and is "en_cours"
  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("id, status")
    .eq("id", seriesId)
    .eq("user_id", user.id)
    .single();

  if (seriesError || !series) {
    return { error: "Serie introuvable." };
  }

  if (series.status !== "en_cours") {
    return { error: "Seules les series en cours peuvent etre supprimees." };
  }

  // A series is deletable when it is empty (no bets) or holds only the
  // first bet, still pending.
  const { data: bets, error: betsError } = await supabase
    .from("bets")
    .select("id, bet_number, result")
    .eq("series_id", seriesId);

  if (betsError) {
    return { error: `Erreur: ${betsError.message}` };
  }

  const isEmpty = !bets || bets.length === 0;
  const isSinglePending =
    !!bets &&
    bets.length === 1 &&
    bets[0].bet_number === 1 &&
    bets[0].result === null;

  if (!isEmpty && !isSinglePending) {
    return {
      error:
        "Seules les series vides ou avec uniquement le pari #1 en cours peuvent etre supprimees.",
    };
  }

  // Delete the series (cascade will delete the bet)
  const { error } = await supabase
    .from("series")
    .delete()
    .eq("id", seriesId);

  if (error) {
    return { error: `Erreur: ${error.message}` };
  }

  revalidatePath("/series");
  revalidatePath("/series/new");
  revalidatePath("/");

  return { success: true };
}

