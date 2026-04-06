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

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Auth check via CRON_SECRET (Vercel cron sends Authorization: Bearer <CRON_SECRET>)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:contact@bettracker.app";

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  // Use service role key to bypass RLS (cron runs without user context)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all users with notifications enabled
  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("user_id, notification_lead_minutes")
    .eq("notifications_enabled", true);

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  if (!settings || settings.length === 0) {
    return NextResponse.json({ message: "No users with notifications enabled" });
  }

  const nowMs = Date.now();
  let totalSent = 0;
  const errors: string[] = [];

  for (const setting of settings) {
    const userId = setting.user_id;
    const leadMs = setting.notification_lead_minutes * 60 * 1000;

    // Window: from now to (now + leadMinutes)
    // We notify when the fixture is within the user's lead window
    const windowEnd = nowMs + leadMs;

    // Fetch active series subjects for this user
    const { data: activeSeries } = await supabase
      .from("series")
      .select("subject")
      .eq("user_id", userId)
      .eq("status", "en_cours");

    const activeSubjects = new Set((activeSeries ?? []).map((s) => s.subject));
    if (activeSubjects.size === 0) continue;

    // Fetch all team mappings for this user (need both subject and club entries)
    const { data: mappings } = await supabase
      .from("team_mappings")
      .select("subject, api_team_id, is_club, cached_fixtures")
      .eq("user_id", userId);

    if (!mappings) continue;

    // Build api_team_id -> next fixture
    const apiIdToFixture: Record<number, CachedFixture> = {};
    for (const m of mappings) {
      if (!m.is_club || !m.api_team_id) continue;
      const fixtures = (m.cached_fixtures as CachedFixture[] | null) ?? [];
      const upcoming = fixtures
        .filter((f) => {
          const t = new Date(f.date).getTime();
          return t > nowMs && t <= windowEnd;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (upcoming.length > 0) {
        apiIdToFixture[m.api_team_id] = upcoming[0];
      }
    }

    // Find subjects (active series) that have an upcoming fixture
    const notifications: { fixture: CachedFixture; subject: string }[] = [];
    for (const m of mappings) {
      if (m.is_club || !m.api_team_id) continue;
      if (!activeSubjects.has(m.subject)) continue;
      const fixture = apiIdToFixture[m.api_team_id];
      if (fixture) {
        notifications.push({ fixture, subject: m.subject });
      }
    }

    if (notifications.length === 0) continue;

    // Check which fixtures we already notified about
    const fixtureIds = notifications.map((n) => n.fixture.id);
    const { data: alreadySent } = await supabase
      .from("sent_notifications")
      .select("fixture_id")
      .eq("user_id", userId)
      .in("fixture_id", fixtureIds);

    const sentIds = new Set((alreadySent ?? []).map((s) => s.fixture_id));
    const toSend = notifications.filter((n) => !sentIds.has(n.fixture.id));

    if (toSend.length === 0) continue;

    // Fetch user's push subscriptions
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (!subs || subs.length === 0) continue;

    // Send notifications
    for (const notif of toSend) {
      const fixtureDate = new Date(notif.fixture.date);
      const hours = String(fixtureDate.getHours()).padStart(2, "0");
      const minutes = String(fixtureDate.getMinutes()).padStart(2, "0");
      const opponent =
        notif.fixture.homeTeam === notif.subject
          ? notif.fixture.awayTeam
          : notif.fixture.homeTeam;

      const payload = JSON.stringify({
        title: `${notif.subject} joue bientot`,
        body: `vs ${opponent} a ${hours}h${minutes} - ${notif.fixture.league}`,
        url: "/series",
        tag: `fixture-${notif.fixture.id}`,
      });

      // Send to all user's devices in parallel
      const sendResults = await Promise.allSettled(
        subs.map((s) =>
          webpush.sendNotification(
            {
              endpoint: s.endpoint,
              keys: { p256dh: s.p256dh, auth: s.auth },
            },
            payload
          )
        )
      );

      // Cleanup expired subscriptions (410 Gone)
      for (let i = 0; i < sendResults.length; i++) {
        const result = sendResults[i];
        if (result.status === "rejected") {
          const err = result.reason;
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("user_id", userId)
              .eq("endpoint", subs[i].endpoint);
          } else {
            errors.push(`User ${userId}: ${err?.message ?? "unknown"}`);
          }
        }
      }

      // Mark as sent
      await supabase.from("sent_notifications").insert({
        user_id: userId,
        fixture_id: notif.fixture.id,
      });

      totalSent++;
    }
  }

  return NextResponse.json({
    success: true,
    sent: totalSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
