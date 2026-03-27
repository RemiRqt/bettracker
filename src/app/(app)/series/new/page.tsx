import { createClient } from "@/lib/supabase/server";
import { SeriesForm } from "@/components/series/series-form";

export default async function NewSeriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingTeams: { subject: string; bet_type: string }[] = [];

  if (user) {
    const { data } = await supabase
      .from("series")
      .select("subject, bet_type")
      .eq("user_id", user.id);

    if (data) {
      // Deduplicate by subject+bet_type
      const seen = new Set<string>();
      existingTeams = data.filter((row) => {
        const key = `${row.subject}::${row.bet_type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-3">
      <h1 className="text-2xl font-bold text-white">Nouveau pari</h1>
      <p className="text-slate-400 text-sm">
        Créez une nouvelle série de paris progressifs
      </p>

      <SeriesForm existingTeams={existingTeams} />
    </div>
  );
}
