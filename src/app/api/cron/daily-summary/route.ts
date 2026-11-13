import { NextRequest, NextResponse } from "next/server";
import { ensureVapid, sendPushToUser } from "@/lib/push";
import { fetchTeamFixtures, type CachedFixture } from "@/lib/football-data";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parisDayBounds(now: Date): { startMs: number; endMs: number } {
  // Compute "today in Paris" using Intl, return UTC ms bounds
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  // Paris is UTC+1 (winter) or UTC+2 (summer). Compute offset by comparing.
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const probeParisHour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      hour12: false,
    }).format(probe),
  );
  const offsetHours = probeParisHour - 12;
  const startMs = Date.UTC(y, m - 1, d, 0, 0, 0) - offsetHours * 3600_000;
  const endMs = startMs + 24 * 3600_000;
  return { startMs, endMs };
}

function formatTimeParis(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

type Service = ReturnType<typeof createServiceClient>;

interface UserClub {
  user_id: string;
  subject: string | null;
  api_team_id: number | null;
  cached_fixtures: unknown;
}

interface TodayFixture {
  fixture: CachedFixture;
  hasActiveSeries: boolean;
  clubLogo: string;
}

/** 1. Refresh fixtures for every distinct starred club across all users */
async function refreshStarredFixtures(supabase: Service): Promise<Map<number, CachedFixture[]>> {
  const { data: starredClubs } = await supabase
    .from("team_mappings")
    .select("id, api_team_id, next_matches_count")
    .eq("is_followed", true)
    .eq("is_club", true)
    .not("api_team_id", "is", null);

  const refreshedFixtures = new Map<number, CachedFixture[]>();
  if (!process.env.FOOTBALL_DATA_API_KEY || !starredClubs) return refreshedFixtures;

  const uniqueIds = Array.from(new Map(starredClubs.map((c) => [c.api_team_id as number, c])).values());
  await Promise.all(
    uniqueIds.map(async (c) => {
      const fx = await fetchTeamFixtures(c.api_team_id as number, c.next_matches_count ?? 5);
      refreshedFixtures.set(c.api_team_id as number, fx);
    }),
  );
  // Persist refresh to all rows of those clubs
  const nowIso = new Date().toISOString();
  await Promise.all(
    Array.from(refreshedFixtures.entries()).map(([apiId, fx]) =>
      supabase.from("team_mappings").update({ cached_fixtures: fx, fixtures_updated_at: nowIso }).eq("api_team_id", apiId).eq("is_club", true),
    ),
  );
  return refreshedFixtures;
}

function groupByUser<T extends { user_id: string }>(rows: T[] | null): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const r of rows ?? []) {
    const arr = map.get(r.user_id) ?? [];
    arr.push(r);
    map.set(r.user_id, arr);
  }
  return map;
}

/** Clubs suivis, séries en cours, liens et entités de tous les users en 4 requêtes (groupées par user). */
async function loadUsersData(supabase: Service, userIds: string[]) {
  const [{ data: clubs }, { data: activeSeries }, { data: links }, { data: entities }] = await Promise.all([
    supabase
      .from("team_mappings")
      .select("user_id, subject, api_team_id, cached_fixtures")
      .in("user_id", userIds)
      .eq("is_followed", true)
      .eq("is_club", true)
      .not("api_team_id", "is", null),
    supabase.from("series").select("user_id, subject").in("user_id", userIds).eq("status", "en_cours"),
    supabase.from("subject_links").select("user_id, subject, team_mapping_id").in("user_id", userIds),
    supabase.from("team_mappings").select("user_id, id, api_team_id").in("user_id", userIds).not("api_team_id", "is", null),
  ]);
  return {
    clubs: groupByUser(clubs as UserClub[] | null),
    activeSeries: groupByUser(activeSeries as { user_id: string; subject: string }[] | null),
    links: groupByUser(links as { user_id: string; subject: string; team_mapping_id: string }[] | null),
    entities: groupByUser(entities as { user_id: string; id: string; api_team_id: number }[] | null),
  };
}

type UsersData = Awaited<ReturnType<typeof loadUsersData>>;

/** User's active series subjects → mapped to api_team_ids (for the 🟢 marker) */
function apiIdsWithActiveSeriesOf(data: UsersData, userId: string): Set<number> {
  const activeSubjects = new Set((data.activeSeries.get(userId) ?? []).map((s) => s.subject));
  const idToApi = new Map((data.entities.get(userId) ?? []).map((e) => [e.id, e.api_team_id]));
  const apiIdsWithActiveSeries = new Set<number>();
  for (const l of data.links.get(userId) ?? []) {
    if (activeSubjects.has(l.subject)) {
      const a = idToApi.get(l.team_mapping_id);
      if (a) apiIdsWithActiveSeries.add(a);
    }
  }
  return apiIdsWithActiveSeries;
}

function clubLogoFor(f: CachedFixture, subject: string): string {
  if (subject && f.homeTeam.toLowerCase().includes(subject.toLowerCase())) return f.homeLogo ?? "";
  if (subject && f.awayTeam.toLowerCase().includes(subject.toLowerCase())) return f.awayLogo ?? "";
  return f.homeLogo ?? "";
}

/** Collect today's fixtures for the user, deduplicated */
function collectTodaysFixtures(
  userClubs: UserClub[],
  refreshedFixtures: Map<number, CachedFixture[]>,
  apiIdsWithActiveSeries: Set<number>,
  window: { start: number; end: number },
): TodayFixture[] {
  const seen = new Set<number>();
  const todays: TodayFixture[] = [];
  for (const club of userClubs) {
    const apiId = club.api_team_id as number;
    const subject = (club.subject as string) ?? "";
    const fixtures = refreshedFixtures.get(apiId) ?? (club.cached_fixtures as CachedFixture[] | null) ?? [];
    for (const f of fixtures) {
      const t = new Date(f.date).getTime();
      if (t < window.start || t >= window.end) continue;
      if (seen.has(f.id)) {
        if (apiIdsWithActiveSeries.has(apiId)) {
          const entry = todays.find((x) => x.fixture.id === f.id);
          if (entry) entry.hasActiveSeries = true;
        }
        continue;
      }
      seen.add(f.id);
      todays.push({ fixture: f, hasActiveSeries: apiIdsWithActiveSeries.has(apiId), clubLogo: clubLogoFor(f, subject) });
    }
  }
  return todays;
}

function buildSummaryPayload(todays: TodayFixture[], nowMs: number) {
  todays.sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
  const lines = todays.map(
    ({ fixture, hasActiveSeries }) => `${formatTimeParis(fixture.date)} ${fixture.homeTeam} vs ${fixture.awayTeam} ${hasActiveSeries ? "🟢" : "⏳"}`,
  );
  return {
    title: "⚽ Suivi de match du jour",
    body: lines.join("\n"),
    icon: todays.length === 1 ? todays[0].clubLogo || undefined : undefined,
    url: "/calendar",
    tag: `daily-summary-${new Date(nowMs).toISOString().slice(0, 10)}`,
  };
}

/** Résumé du jour de chaque user (envois en parallèle, erreurs dans l'ordre des users). */
async function sendDailySummaries(supabase: Service, userIds: string[], refreshedFixtures: Map<number, CachedFixture[]>) {
  const nowMs = Date.now();
  const { startMs: dayStart, endMs: dayEnd } = parisDayBounds(new Date(nowMs));
  const window = { start: Math.max(nowMs, dayStart), end: dayEnd };
  const data = await loadUsersData(supabase, userIds);

  const results = await Promise.all(
    userIds.map(async (userId) => {
      const userClubs = data.clubs.get(userId) ?? [];
      if (userClubs.length === 0) return { sent: 0, errors: [] as string[] };
      const todays = collectTodaysFixtures(userClubs, refreshedFixtures, apiIdsWithActiveSeriesOf(data, userId), window);
      if (todays.length === 0) return { sent: 0, errors: [] as string[] };
      return sendPushToUser(supabase, userId, buildSummaryPayload(todays, nowMs));
    }),
  );
  return {
    totalSent: results.reduce((s, r) => s + r.sent, 0),
    errors: results.flatMap((r) => r.errors),
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ensureVapid()) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  const supabase = createServiceClient();
  const refreshedFixtures = await refreshStarredFixtures(supabase);

  // 2. Find users with notifications enabled
  const { data: settings } = await supabase.from("user_settings").select("user_id").eq("notifications_enabled", true);

  if (!settings || settings.length === 0) {
    return NextResponse.json({ message: "No users with notifications enabled" });
  }

  const userIds = settings.map((s) => s.user_id as string);
  const { totalSent, errors } = await sendDailySummaries(supabase, userIds, refreshedFixtures);

  return NextResponse.json({
    success: true,
    sent: totalSent,
    refreshedClubs: refreshedFixtures.size,
    errors: errors.length > 0 ? errors : undefined,
  });
}
