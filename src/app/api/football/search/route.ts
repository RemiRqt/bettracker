import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";

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
      `${API_FOOTBALL_BASE}/teams?search=${encodeURIComponent(searchTerm)}`,
      {
        headers: {
          "x-apisports-key": process.env.API_FOOTBALL_KEY!,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erreur lors de la recherche API-Football." },
        { status: response.status }
      );
    }

    const json = await response.json();
    const results = json.response ?? [];

    const searchLower = searchTerm.toLowerCase();

    const teams = results
      .filter((item: { team: { national: boolean; name: string } }) => {
        // Include national teams only if the search term matches
        if (item.team.national) {
          return item.team.name.toLowerCase().includes(searchLower);
        }
        return true;
      })
      .map(
        (item: {
          team: { id: number; name: string; logo: string };
          venue: { city: string | null };
        }) => ({
          id: item.team.id,
          name: item.team.name,
          country:
            results.find(
              (r: { team: { id: number } }) => r.team.id === item.team.id
            )?.team?.country ?? null,
          logo: item.team.logo,
        })
      );

    // Store in cache
    cache.set(cacheKey, { data: teams, timestamp: Date.now() });

    return NextResponse.json(teams);
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la connexion a API-Football." },
      { status: 500 }
    );
  }
}
