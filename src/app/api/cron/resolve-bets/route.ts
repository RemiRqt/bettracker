import { NextRequest, NextResponse } from "next/server";
import { runResolveBets } from "@/lib/resolve-bets-job";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Appelée toutes les 30 min de 17h à 23h30 (Paris, hiver) par pg_cron (migrations 00021, 00025). */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const report = await runResolveBets(supabase);
  if (report.errors.length > 0) console.error("[resolve-bets]", report.errors);
  return NextResponse.json(report);
}
