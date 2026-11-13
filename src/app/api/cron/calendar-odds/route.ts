import { NextRequest, NextResponse } from "next/server";
import { isNoonInParis, runCalendarOdds } from "@/lib/calendar-odds-job";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Appelée par pg_cron à 10h et 11h UTC (migration 00023) : ne s'exécute qu'à
 * 12h heure de Paris (été comme hiver). `?force=1` ignore l'heure.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const force = request.nextUrl.searchParams.get("force") === "1";
  if (!force && !isNoonInParis()) {
    return NextResponse.json({ skipped: "not noon in Paris" });
  }

  const supabase = createServiceClient();
  return NextResponse.json(await runCalendarOdds(supabase));
}
