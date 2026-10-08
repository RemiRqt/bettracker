import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Notif push à tous les abonnés (ou à `userIds`). Protégée par CRON_SECRET.
 * Body : { title, body, url?, tag?, userIds? }. iOS : titre sur 1 ligne (~25 car.), corps multi-lignes.
 */
export async function POST(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { title, body, url = "/", tag = "broadcast", userIds } = (await request.json()) as {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
    userIds?: string[];
  };
  if (!title || !body) return NextResponse.json({ error: "title et body requis" }, { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  let targets = userIds;
  if (!targets) {
    const { data } = await supabase.from("push_subscriptions").select("user_id");
    targets = [...new Set((data ?? []).map((s) => s.user_id as string))];
  }

  let sent = 0;
  const errors: string[] = [];
  for (const userId of targets) {
    const res = await sendPushToUser(supabase, userId, { title, body, url, tag });
    sent += res.sent;
    errors.push(...res.errors);
  }
  return NextResponse.json({ users: targets.length, sent, errors });
}
