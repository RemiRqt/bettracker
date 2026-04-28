import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

interface CachedFixture {
  id: number;
  date: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
}

interface FootballMatch {
  id: number;
  utcDate: string;
  homeTeam: { name: string; shortName: string; crest: string };
  awayTeam: { name: string; shortName: string; crest: string };
  competition: { name: string; emblem: string };
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";

async function fetchTeamNextEvents(
  teamId: number,
  apiKey: string,
  maxCount: number,
): Promise<CachedFixture[]> {
  try {
    const url = `${FOOTBALL_DATA_BASE}/teams/${teamId}/matches?status=SCHEDULED&limit=${maxCount}`;
    const res = await fetch(url, { headers: { "X-Auth-Token": apiKey } });
    if (!res.ok) return [];
    const json = (await res.json()) as { matches?: FootballMatch[] };
    return (json.matches ?? []).map((m: FootballMatch) => ({
      id: m.id,
      date: m.utcDate,
      homeTeam: m.homeTeam.shortName || m.homeTeam.name,
      awayTeam: m.awayTeam.shortName || m.awayTeam.name,
      league: m.competition.name,
    }));
  } catch {
    return [];
  }
}

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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:contact@bettracker.app";
  const footballApiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 1. Refresh fixtures for every distinct starred club across all users
  const { data: starredClubs } = await supabase
    .from("team_mappings")
    .select("id, api_team_id, next_matches_count")
    .eq("is_followed", true)
    .eq("is_club", true)
    .not("api_team_id", "is", null);

  const refreshedFixtures = new Map<number, CachedFixture[]>();
  if (footballApiKey && starredClubs) {
    const uniqueIds = Array.from(
      new Map(starredClubs.map((c) => [c.api_team_id as number, c])).values(),
    );
    await Promise.all(
      uniqueIds.map(async (c) => {
        const fx = await fetchTeamNextEvents(
          c.api_team_id as number,
          footballApiKey,
          c.next_matches_count ?? 5,
        );
        refreshedFixtures.set(c.api_team_id as number, fx);
      }),
    );
    // Persist refresh to all rows of those clubs
    const nowIso = new Date().toISOString();
    await Promise.all(
      Array.from(refreshedFixtures.entries()).map(([apiId, fx]) =>
        supabase
          .from("team_mappings")
          .update({ cached_fixtures: fx, fixtures_updated_at: nowIso })
          .eq("api_team_id", apiId)
          .eq("is_club", true),
      ),
    );
  }

  // 2. Find users with notifications enabled
  const { data: settings } = await supabase
    .from("user_settings")
    .select("user_id")
    .eq("notifications_enabled", true);

  if (!settings || settings.length === 0) {
    return NextResponse.json({ message: "No users with notifications enabled" });
  }

  const nowMs = Date.now();
  const { startMs: dayStart, endMs: dayEnd } = parisDayBounds(new Date(nowMs));
  const windowStart = Math.max(nowMs, dayStart);
  const windowEnd = dayEnd;

  let totalSent = 0;
  const errors: string[] = [];

  for (const setting of settings) {
    const userId = setting.user_id;

    // User's starred clubs
    const { data: userClubs } = await supabase
      .from("team_mappings")
      .select("api_team_id, cached_fixtures")
      .eq("user_id", userId)
      .eq("is_followed", true)
      .eq("is_club", true)
      .not("api_team_id", "is", null);

    if (!userClubs || userClubs.length === 0) continue;

    // User's active series subjects → mapped to api_team_ids (for the 🟢 marker)
    const { data: activeSeries } = await supabase
      .from("series")
      .select("subject")
      .eq("user_id", userId)
      .eq("status", "en_cours");
    const activeSubjects = new Set((activeSeries ?? []).map((s) => s.subject));

    const { data: subjMappings } = await supabase
      .from("team_mappings")
      .select("subject, api_team_id")
      .eq("user_id", userId)
      .not("api_team_id", "is", null);

    const apiIdsWithActiveSeries = new Set<number>();
    for (const m of subjMappings ?? []) {
      if (activeSubjects.has(m.subject) && m.api_team_id) {
        apiIdsWithActiveSeries.add(m.api_team_id as number);
      }
    }

    // Collect today's fixtures for the user, deduplicated
    const seen = new Set<number>();
    const todays: { fixture: CachedFixture; hasActiveSeries: boolean }[] = [];

    for (const club of userClubs) {
      const apiId = club.api_team_id as number;
      const fixtures =
        refreshedFixtures.get(apiId) ??
        ((club.cached_fixtures as CachedFixture[] | null) ?? []);
      for (const f of fixtures) {
        const t = new Date(f.date).getTime();
        if (t < windowStart || t >= windowEnd) continue;
        if (seen.has(f.id)) {
          // Update marker if this club brings active-series flag
          if (apiIdsWithActiveSeries.has(apiId)) {
            const entry = todays.find((x) => x.fixture.id === f.id);
            if (entry) entry.hasActiveSeries = true;
          }
          continue;
        }
        seen.add(f.id);
        todays.push({ fixture: f, hasActiveSeries: apiIdsWithActiveSeries.has(apiId) });
      }
    }

    if (todays.length === 0) continue;

    todays.sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

    const lines = todays.map(
      ({ fixture, hasActiveSeries }) =>
        `${formatTimeParis(fixture.date)} ${fixture.homeTeam} vs ${fixture.awayTeam} ${
          hasActiveSeries ? "🟢" : "⏳"
        }`,
    );

    const title =
      todays.length === 1
        ? "1 match aujourd'hui"
        : `${todays.length} matchs aujourd'hui`;
    const body = lines.join("\n");

    // Get push subs
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);
    if (!subs || subs.length === 0) continue;

    const payload = JSON.stringify({
      title,
      body,
      url: "/calendar",
      tag: `daily-summary-${new Date(nowMs).toISOString().slice(0, 10)}`,
    });

    const sendResults = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        ),
      ),
    );

    for (let i = 0; i < sendResults.length; i++) {
      const r = sendResults[i];
      if (r.status === "rejected") {
        const err = r.reason as { statusCode?: number; message?: string };
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("user_id", userId)
            .eq("endpoint", subs[i].endpoint);
        } else {
          errors.push(`User ${userId}: ${err?.message ?? "unknown"}`);
        }
      } else {
        totalSent++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    sent: totalSent,
    refreshedClubs: refreshedFixtures.size,
    errors: errors.length > 0 ? errors : undefined,
  });
}
