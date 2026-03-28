import { getCalendarTeams, ensureTeamMappings } from "@/actions/teams";
import { CalendarPage } from "@/components/calendar/calendar-page";

export default async function CalendarRoute() {
  // Ensure mappings are up to date, then get calendar-relevant teams
  await ensureTeamMappings();
  const teams = await getCalendarTeams();

  return <CalendarPage teams={teams} />;
}
