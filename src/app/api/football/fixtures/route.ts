import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Non authentifie." },
      { status: 401 }
    );
  }

  const teamId = request.nextUrl.searchParams.get("teamId");
  const count = request.nextUrl.searchParams.get("count") ?? "2";

  if (!teamId) {
    return NextResponse.json(
      { error: "Le parametre 'teamId' est requis." },
      { status: 400 }
    );
  }

  const countNum = parseInt(count, 10);
  if (isNaN(countNum) || countNum < 1 || countNum > 10) {
    return NextResponse.json(
      { error: "Le parametre 'count' doit etre un nombre entre 1 et 10." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${API_FOOTBALL_BASE}/fixtures?team=${encodeURIComponent(teamId)}&next=${countNum}`,
      {
        headers: {
          "x-apisports-key": process.env.API_FOOTBALL_KEY!,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur lors de la requete API-Football." },
        { status: response.status }
      );
    }

    const json = await response.json();
    const results = json.response ?? [];

    const fixtures = results.map(
      (item: {
        fixture: { id: number; date: string; venue: { name: string | null } };
        teams: {
          home: { name: string; logo: string };
          away: { name: string; logo: string };
        };
        league: { name: string; logo: string };
      }) => ({
        id: item.fixture.id,
        date: item.fixture.date,
        home: {
          name: item.teams.home.name,
          logo: item.teams.home.logo,
        },
        away: {
          name: item.teams.away.name,
          logo: item.teams.away.logo,
        },
        league: {
          name: item.league.name,
          logo: item.league.logo,
        },
        venue: item.fixture.venue?.name ?? null,
      })
    );

    return NextResponse.json(fixtures);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la connexion a API-Football." },
      { status: 500 }
    );
  }
}
