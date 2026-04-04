import { createClient } from "@/lib/supabase/server";
import {
  ensureTeamMappings,
  getCalendarFixtures,
  getCalendarTeams,
  type CachedFixture,
} from "@/actions/teams";
import { CalendarPage } from "@/components/calendar/calendar-page";

export const dynamic = "force-dynamic";

export const metadata = { title: "Calendrier | BetTracker" };

export interface ActiveSeriesInfo {
  id: string;
  subject: string;
  bet_type: string;
  target_gain: number;
}

export default async function CalendarRoute() {
  const supabase = await createClient();

  // Ensure mappings are up to date, then fetch cached fixtures
  await ensureTeamMappings();
  const calendarTeams = await getCalendarTeams();

  const [teamFixtures, { data: activeSeries }, { data: allMappings }] =
    await Promise.all([
      getCalendarFixtures(),
      supabase
        .from("series")
        .select("id, subject, bet_type, target_gain, status")
        .eq("status", "en_cours"),
      supabase
        .from("team_mappings")
        .select("subject, api_team_id, is_club"),
    ]);

  // Build map: api_team_id → linked subject names
  const apiTeamToSubjects = new Map<number, Set<string>>();
  for (const m of allMappings ?? []) {
    if (m.api_team_id) {
      const subjects = apiTeamToSubjects.get(m.api_team_id) ?? new Set();
      subjects.add(m.subject);
      apiTeamToSubjects.set(m.api_team_id, subjects);
    }
  }

  // Build map: subject → active series list
  const subjectToSeries = new Map<string, ActiveSeriesInfo[]>();
  for (const s of activeSeries ?? []) {
    const list = subjectToSeries.get(s.subject) ?? [];
    list.push({
      id: s.id,
      subject: s.subject,
      bet_type: s.bet_type,
      target_gain: s.target_gain,
    });
    subjectToSeries.set(s.subject, list);
  }

  // Flatten fixtures and attach active series
  const allFixtures: {
    fixture: CachedFixture;
    teamSubject: string;
    activeSeries: ActiveSeriesInfo[];
  }[] = [];

  let lastUpdated: string | null = null;

  for (const { team, fixtures } of teamFixtures) {
    if (
      team.fixtures_updated_at &&
      (!lastUpdated || team.fixtures_updated_at > lastUpdated)
    ) {
      lastUpdated = team.fixtures_updated_at;
    }

    // Find all subjects linked to this club's api_team_id
    const linkedSubjects = team.api_team_id
      ? apiTeamToSubjects.get(team.api_team_id) ?? new Set<string>()
      : new Set<string>();

    // Collect active series for all linked subjects
    const relatedSeries: ActiveSeriesInfo[] = [];
    for (const subject of linkedSubjects) {
      const series = subjectToSeries.get(subject);
      if (series) relatedSeries.push(...series);
    }

    for (const fixture of fixtures) {
      allFixtures.push({
        fixture,
        teamSubject: team.subject,
        activeSeries: relatedSeries,
      });
    }
  }

  // Sort all fixtures by date
  allFixtures.sort(
    (a, b) =>
      new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );

  return (
    <CalendarPage
      fixtures={allFixtures}
      lastUpdated={lastUpdated}
      teamCount={calendarTeams.length}
      teamNames={calendarTeams.map((t) => t.subject)}
    />
  );
}
