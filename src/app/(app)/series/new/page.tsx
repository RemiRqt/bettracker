import { createClient } from "@/lib/supabase/server";
import { ParisPage } from "@/components/paris/paris-page";

export default async function NewSeriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch all bets with their parent series info
  const { data: bets } = await supabase
    .from("bets")
    .select(
      "*, series!inner(id, subject, bet_type, status, target_gain, user_id)"
    )
    .eq("series.user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch all series to build grouped teams dropdown
  const { data: allSeries } = await supabase
    .from("series")
    .select("subject, bet_type, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Group series by subject+bet_type, determine lastStatus from most recent
  const groupMap = new Map<
    string,
    { subject: string; bet_type: string; lastStatus: string }
  >();

  if (allSeries) {
    for (const s of allSeries) {
      const key = `${s.subject}::${s.bet_type}`;
      // First occurrence is the most recent (ordered by created_at DESC)
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          subject: s.subject,
          bet_type: s.bet_type,
          lastStatus: s.status,
        });
      }
    }
  }

  // Sort: en_cours first, then abandonnee, then gagnee
  const statusOrder: Record<string, number> = {
    en_cours: 0,
    abandonnee: 1,
    gagnee: 2,
  };

  const existingTeams = Array.from(groupMap.values()).sort(
    (a, b) =>
      (statusOrder[a.lastStatus] ?? 99) - (statusOrder[b.lastStatus] ?? 99)
  );

  // Raw teams for the form (without lastStatus)
  const existingTeamsRaw = existingTeams.map((t) => ({
    subject: t.subject,
    bet_type: t.bet_type,
  }));

  return (
    <ParisPage
      bets={bets ?? []}
      existingTeams={existingTeams}
      existingTeamsRaw={existingTeamsRaw}
    />
  );
}
