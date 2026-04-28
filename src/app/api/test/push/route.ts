import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:contact@bettracker.app";
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: "No subscriptions for this user" }, { status: 404 });
  }

  const payload = JSON.stringify({
    title: "BetTracker test",
    body: `Hello ${user.email ?? "iPhone"} — il est ${new Date().toLocaleTimeString("fr-FR")}`,
    url: "/profile",
    tag: "test-push",
  });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      ),
    ),
  );

  const summary = results.map((r, i) => ({
    endpoint: subs[i].endpoint.slice(0, 60) + "...",
    ok: r.status === "fulfilled",
    statusCode: r.status === "fulfilled" ? r.value.statusCode : (r.reason as { statusCode?: number })?.statusCode,
    error: r.status === "rejected" ? (r.reason as Error)?.message : undefined,
  }));

  return NextResponse.json({ sent: subs.length, results: summary });
}
