import { createClient } from "@/lib/supabase/server";
import {
  ensureTeamMappings,
  getCalendarFixtures,
  getCalendarTeams,
  getSubjectLinks,
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

  const [teamFixtures, { data: activeSeries }, links] =
    await Promise.all([
      getCalendarFixtures(),
      supabase
        .from("series")
        .select("id, subject, bet_type, target_gain, status")
        .eq("status", "en_cours"),
      getSubjectLinks(),
    ]);

  // Build map: team_mapping_id → subjects linked to it (via subject_links)
  const entityToSubjects = new Map<string, Set<string>>();
  for (const l of links) {
    const set = entityToSubjects.get(l.team_mapping_id) ?? new Set<string>();
    set.add(l.subject);
    entityToSubjects.set(l.team_mapping_id, set);
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

    // Find all subjects linked to this entity (via subject_links)
    const linkedSubjects = entityToSubjects.get(team.id) ?? new Set<string>();

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
