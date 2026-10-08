import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runResolveBets } from "@/lib/resolve-bets-job";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Appelée toutes les 15 min par pg_cron (migration 00021). */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const report = await runResolveBets(supabase);
  if (report.errors.length > 0) console.error("[resolve-bets]", report.errors);
  return NextResponse.json(report);
}
