import { createClient } from "@/lib/supabase/server";
import { SeriesList } from "@/components/series/series-list";

export default async function SeriesPage() {
  const supabase = await createClient();

  const { data: series, error } = await supabase
    .from("series")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erreur lors du chargement des series : ${error.message}`);
  }

  return <SeriesList series={series ?? []} />;
}
