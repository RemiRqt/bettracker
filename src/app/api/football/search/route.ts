import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";

// In-memory cache: competition code -> { teams, timestamp }
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours (teams don't change often)

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  const competition = request.nextUrl.searchParams.get("competition");

  if (!competition || !competition.trim()) {
    return NextResponse.json(
      { error: "Le parametre 'competition' est requis." },
      { status: 400 }
    );
  }

  const cacheKey = `teams:${competition}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "FOOTBALL_DATA_API_KEY non configuree." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${FOOTBALL_DATA_BASE}/competitions/${encodeURIComponent(competition)}/teams`,
      { headers: { "X-Auth-Token": apiKey } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur football-data.org." },
        { status: response.status }
      );
    }

    const json = await response.json();
    const teams = (json.teams ?? []).map(
      (team: { id: number; name: string; shortName: string; crest: string }) => ({
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        logo: team.crest,
      })
    );

    cache.set(cacheKey, { data: teams, timestamp: Date.now() });

    return NextResponse.json(teams, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur de connexion a football-data.org." },
      { status: 500 }
    );
  }
}
