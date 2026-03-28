"use client";

import { useState, useEffect } from "react";
import type { TeamMapping } from "@/actions/teams";
import { TeamLogo } from "@/components/ui/team-logo";
import { CalendarDays, Loader2, TicketPlus } from "lucide-react";
import Link from "next/link";

interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
    };
  };
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
}

interface GroupedFixtures {
  [date: string]: Fixture[];
}

interface CalendarPageProps {
  teams: TeamMapping[];
}

export function CalendarPage({ teams }: CalendarPageProps) {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFixtures() {
      setLoading(true);
      setError(null);

      const teamsWithApi = teams.filter((t) => t.api_team_id);

      if (teamsWithApi.length === 0) {
        setFixtures([]);
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.allSettled(
          teamsWithApi.map(async (team) => {
            const res = await fetch(
              `/api/football/fixtures?teamId=${team.api_team_id}&count=${team.next_matches_count}`
            );
            if (!res.ok) return [];
            const data = await res.json();
            return data.fixtures || [];
          })
        );

        const allFixtures: Fixture[] = [];
        const seenIds = new Set<number>();

        for (const result of results) {
          if (result.status === "fulfilled") {
            for (const fixture of result.value) {
              if (!seenIds.has(fixture.fixture.id)) {
                seenIds.add(fixture.fixture.id);
                allFixtures.push(fixture);
              }
            }
          }
        }

        // Sort by date
        allFixtures.sort(
          (a, b) =>
            new Date(a.fixture.date).getTime() -
            new Date(b.fixture.date).getTime()
        );

        setFixtures(allFixtures);
      } catch {
        setError("Erreur lors du chargement des matchs.");
      } finally {
        setLoading(false);
      }
    }

    fetchFixtures();
  }, [teams]);

  // Group fixtures by date
  const grouped: GroupedFixtures = {};
  for (const fixture of fixtures) {
    const date = new Date(fixture.fixture.date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(fixture);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-[#1e293b] p-4 md:p-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-[#10b981]" />
            <h1 className="text-lg font-semibold text-white font-[family-name:var(--font-poppins)]">
              Calendrier
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
          <p className="text-sm text-slate-400">
            Chargement des matchs...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-[#1e293b] p-4 md:p-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-[#10b981]" />
            <h1 className="text-lg font-semibold text-white font-[family-name:var(--font-poppins)]">
              Calendrier
            </h1>
          </div>
        </div>
        <div className="rounded-xl bg-[#1e293b] p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-[#1e293b] p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-[#10b981]" />
            <h1 className="text-lg font-semibold text-white font-[family-name:var(--font-poppins)]">
              Calendrier
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            {fixtures.length} match{fixtures.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {fixtures.length === 0 && (
        <div className="rounded-xl bg-[#1e293b] p-6 text-center space-y-3">
          <CalendarDays className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">
            Aucun match a venir.
          </p>
          <p className="text-xs text-slate-500">
            Suivez des equipes depuis votre profil pour voir leurs prochains matchs.
          </p>
          <Link
            href="/profile"
            className="inline-block mt-2 text-sm text-[#10b981] hover:text-emerald-300 transition-colors"
          >
            Gerer mes equipes
          </Link>
        </div>
      )}

      {/* Grouped fixtures */}
      {Object.entries(grouped).map(([date, dateFixtures]) => (
        <div key={date} className="space-y-2">
          <h2 className="text-xs uppercase tracking-wide text-slate-400 px-1 font-[family-name:var(--font-poppins)]">
            {date}
          </h2>

          {dateFixtures.map((fixture) => (
            <FixtureCard key={fixture.fixture.id} fixture={fixture} />
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Fixture Card ---

function FixtureCard({ fixture }: { fixture: Fixture }) {
  const time = new Date(fixture.fixture.date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl bg-[#1e293b] p-3 space-y-2.5">
      {/* League + Time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {fixture.league.logo && (
            <img
              src={fixture.league.logo}
              alt=""
              className="h-4 w-4 object-contain"
            />
          )}
          <span className="text-xs text-slate-400 truncate max-w-[180px]">
            {fixture.league.name}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-300">{time}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-sm text-white truncate text-right">
            {fixture.teams.home.name}
          </span>
          <TeamLogo logoUrl={fixture.teams.home.logo} size="sm" />
        </div>

        {/* VS */}
        <span className="text-xs font-bold text-slate-500 px-1">VS</span>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          <TeamLogo logoUrl={fixture.teams.away.logo} size="sm" />
          <span className="text-sm text-white truncate">
            {fixture.teams.away.name}
          </span>
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Link
          href="/series/new"
          className="flex items-center gap-1.5 text-xs text-[#10b981] hover:text-emerald-300 transition-colors"
        >
          <TicketPlus className="h-3.5 w-3.5" />
          Saisir cote
        </Link>
      </div>
    </div>
  );
}
