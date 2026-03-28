import {
  ensureTeamMappings,
  getCalendarFixtures,
  type CachedFixture,
} from "@/actions/teams";
import { CalendarPage } from "@/components/calendar/calendar-page";

export default async function CalendarRoute() {
  // Ensure mappings are up to date, then fetch cached fixtures
  await ensureTeamMappings();
  const teamFixtures = await getCalendarFixtures();

  // Flatten all fixtures with their team subject, then sort by date
  const allFixtures: { fixture: CachedFixture; teamSubject: string }[] = [];

  // Track the most recent update timestamp across all teams
  let lastUpdated: string | null = null;

  for (const { team, fixtures } of teamFixtures) {
    if (
      team.fixtures_updated_at &&
      (!lastUpdated || team.fixtures_updated_at > lastUpdated)
    ) {
      lastUpdated = team.fixtures_updated_at;
    }

    for (const fixture of fixtures) {
      allFixtures.push({ fixture, teamSubject: team.subject });
    }
  }

  // Sort all fixtures by date
  allFixtures.sort(
    (a, b) =>
      new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
  );

  return <CalendarPage fixtures={allFixtures} lastUpdated={lastUpdated} />;
}
