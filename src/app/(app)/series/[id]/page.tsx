import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SeriesDetail } from "@/components/series/series-detail";
import type { SeriesWithBets } from "@/lib/types";

interface SeriesDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: series, error: seriesError } = await supabase
    .from("series")
    .select("*")
    .eq("id", id)
    .single();

  if (seriesError || !series) {
    notFound();
  }

  const [{ data: bets, error: betsError }, { data: links }] = await Promise.all([
    supabase
      .from("bets")
      .select("*")
      .eq("series_id", id)
      .order("bet_number", { ascending: true }),
    supabase
      .from("subject_links")
      .select("team_mappings!inner(api_team_id, is_club)")
      .eq("subject", series.subject)
      .not("team_mappings.api_team_id", "is", null)
      .limit(5),
  ]);

  if (betsError) {
    throw new Error(`Erreur lors du chargement des paris : ${betsError.message}`);
  }

  const seriesWithBets: SeriesWithBets = {
    ...series,
    bets: bets ?? [],
  };

  const teams = ((links ?? []) as unknown as {
    team_mappings: { api_team_id: number; is_club: boolean };
  }[]).map((l) => l.team_mappings);
  const apiTeamId =
    (teams.find((t) => t.is_club) ?? teams[0])?.api_team_id ?? null;

  return <SeriesDetail series={seriesWithBets} apiTeamId={apiTeamId} />;
}
