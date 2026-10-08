import { createClient } from "@/lib/supabase/server";
import {
  ensureTeamMappings,
  getCalendarFixtures,
  getCalendarTeams,
  getSubjectLinks,
  type CachedFixture,
} from "@/actions/teams";
import { CalendarPage } from "@/components/calendar/calendar-page";
import { getNotificationSettings } from "@/actions/notifications";
import { sportKeyFor } from "@/lib/odds-api";
import { bestPerOutcome, findEvent, type OddsEvent, type OutcomeBest } from "@/lib/odds-matching";

export type FixtureOdds = { home: OutcomeBest | null; draw: OutcomeBest | null; away: OutcomeBest | null } | null;

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
    odds?: FixtureOdds;
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

  const oddsUpdatedAt = await attachOdds(supabase, allFixtures);

  return (
    <CalendarPage
      fixtures={allFixtures}
      oddsUpdatedAt={oddsUpdatedAt}
      lastUpdated={lastUpdated}
      teamCount={calendarTeams.length}
      teamNames={calendarTeams.map((t) => t.subject)}
    />
  );
}

/**
 * Ajoute à chaque match la meilleure cote 1/N/2 parmi les bookmakers du user,
 * depuis le cache rafraîchi à midi (aucun appel API ici). Renvoie la date du cache.
 */
async function attachOdds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: { fixture: CachedFixture; odds?: FixtureOdds }[],
): Promise<string | null> {
  const keys = [...new Set(items.map((i) => sportKeyFor(i.fixture)).filter((k): k is string => !!k))];
  if (keys.length === 0) return null;

  const [{ bookmakers }, { data: rows }] = await Promise.all([
    getNotificationSettings(),
    supabase.from("odds_cache").select("sport_key, events, fetched_at").in("sport_key", keys),
  ]);
  const byKey = new Map((rows ?? []).map((r) => [r.sport_key as string, r.events as OddsEvent[]]));

  for (const item of items) {
    const f = item.fixture;
    const events = byKey.get(sportKeyFor(f) ?? "");
    const event = events
      ? findEvent(events, {
          kickoff: f.date,
          homeNames: [f.homeTeamName, f.homeTeam].filter((n): n is string => !!n),
          awayNames: [f.awayTeamName, f.awayTeam].filter((n): n is string => !!n),
        })
      : null;
    item.odds = event ? bestPerOutcome(event, bookmakers) : null;
  }
  const dates = (rows ?? []).map((r) => r.fetched_at as string).sort();
  return dates.at(-1) ?? null;
}
