import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const SPORTAPI_BASE = "https://sportapi7.p.rapidapi.com";

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
      `${SPORTAPI_BASE}/api/v1/team/${encodeURIComponent(teamId)}/events/next/0`,
      {
        headers: {
          "x-rapidapi-host": "sportapi7.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur lors de la requete SportAPI." },
        { status: response.status }
      );
    }

    const json = await response.json();
    const events = json.events ?? [];

    const fixtures = events.slice(0, countNum).map(
      (event: {
        id: number;
        startTimestamp: number;
        homeTeam: { name: string; id: number };
        awayTeam: { name: string; id: number };
        tournament: {
          name: string;
          uniqueTournament?: { id: number };
        };
      }) => ({
        id: event.id,
        date: new Date(event.startTimestamp * 1000).toISOString(),
        home: {
          name: event.homeTeam.name,
          logo: `/api/football/image?teamId=${event.homeTeam.id}`,
        },
        away: {
          name: event.awayTeam.name,
          logo: `/api/football/image?teamId=${event.awayTeam.id}`,
        },
        league: {
          name: event.tournament.name,
          logo: event.tournament.uniqueTournament
            ? `/api/football/image?teamId=${event.tournament.uniqueTournament.id}&type=tournament`
            : null,
        },
        venue: null,
      })
    );

    return NextResponse.json(fixtures);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la connexion a SportAPI." },
      { status: 500 }
    );
  }
}
