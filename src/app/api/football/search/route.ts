import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const SPORTAPI_BASE = "https://sportapi7.p.rapidapi.com";

// In-memory cache: key -> { data, timestamp }
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

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

  const q = request.nextUrl.searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json(
      { error: "Le parametre de recherche 'q' est requis." },
      { status: 400 }
    );
  }

  const searchTerm = q.trim();
  const cacheKey = `search:${searchTerm.toLowerCase()}`;

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const response = await fetch(
      `${SPORTAPI_BASE}/api/v1/search/teams/${encodeURIComponent(searchTerm)}/0`,
      {
        headers: {
          "x-rapidapi-host": "sportapi7.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur lors de la recherche SportAPI." },
        { status: response.status }
      );
    }

    const json = await response.json();
    const results = json.teams ?? [];

    const searchLower = searchTerm.toLowerCase();

    const teams = results
      .filter((team: { sport: { slug: string }; national: boolean; name: string; gender: string }) => {
        // Only football teams
        if (team.sport.slug !== "football") return false;
        // Only male teams (skip women/youth unless searched)
        if (team.gender !== "M") return false;
        // Include national teams only if the search term matches
        if (team.national) {
          return team.name.toLowerCase().includes(searchLower);
        }
        return true;
      })
      .map(
        (team: {
          id: number;
          name: string;
          country?: { name: string } | null;
        }) => ({
          id: team.id,
          name: team.name,
          country: team.country?.name ?? null,
          logo: `https://api.sofascore.app/api/v1/team/${team.id}/image`,
        })
      );

    // Store in cache
    cache.set(cacheKey, { data: teams, timestamp: Date.now() });

    return NextResponse.json(teams);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la connexion a SportAPI." },
      { status: 500 }
    );
  }
}
