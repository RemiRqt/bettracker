import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifie." }, { status: 401 });
  }

  const teamId = request.nextUrl.searchParams.get("teamId");
  const limit = request.nextUrl.searchParams.get("limit") ?? "5";

  if (!teamId) {
    return NextResponse.json(
      { error: "Le parametre 'teamId' est requis." },
      { status: 400 }
    );
  }

  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 10);

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "FOOTBALL_DATA_API_KEY non configuree." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${FOOTBALL_DATA_BASE}/teams/${encodeURIComponent(teamId)}/matches?status=SCHEDULED&limit=${limitNum}`,
      { headers: { "X-Auth-Token": apiKey } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur football-data.org." },
        { status: response.status }
      );
    }

    const json = await response.json();
    const matches = json.matches ?? [];

    const fixtures = matches.map(
      (match: {
        id: number;
        utcDate: string;
        homeTeam: { id: number; name: string; shortName: string; crest: string };
        awayTeam: { id: number; name: string; shortName: string; crest: string };
        competition: { name: string; emblem: string };
      }) => ({
        id: match.id,
        date: match.utcDate,
        homeTeam: match.homeTeam.shortName || match.homeTeam.name,
        homeLogo: match.homeTeam.crest,
        awayTeam: match.awayTeam.shortName || match.awayTeam.name,
        awayLogo: match.awayTeam.crest,
        league: match.competition.name,
        leagueLogo: match.competition.emblem || "",
      })
    );

    return NextResponse.json(fixtures, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur de connexion a football-data.org." },
      { status: 500 }
    );
  }
}
