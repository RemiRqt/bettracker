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

  const { data: bets, error: betsError } = await supabase
    .from("bets")
    .select("*")
    .eq("series_id", id)
    .order("bet_number", { ascending: true });

  if (betsError) {
    throw new Error(`Erreur lors du chargement des paris : ${betsError.message}`);
  }

  const seriesWithBets: SeriesWithBets = {
    ...series,
    bets: bets ?? [],
  };

  return <SeriesDetail series={seriesWithBets} />;
}
