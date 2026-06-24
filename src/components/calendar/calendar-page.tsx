"use client";

import { useTransition } from "react";
import type { CachedFixture } from "@/actions/teams";
import type { ActiveSeriesInfo } from "@/app/(app)/calendar/page";
import { refreshCalendarFixtures } from "@/actions/teams";
import { TeamLogo } from "@/components/ui/team-logo";
import { BET_TYPES } from "@/lib/constants";
import { CalendarDays, Clock, RefreshCw, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CalendarPageProps {
  fixtures: {
    fixture: CachedFixture;
    teamSubject: string;
    activeSeries: ActiveSeriesInfo[];
  }[];
  lastUpdated: string | null;
  teamCount?: number;
  teamNames?: string[];
}

interface GroupedFixtures {
  [date: string]: {
    fixture: CachedFixture;
    teamSubject: string;
    activeSeries: ActiveSeriesInfo[];
  }[];
}

export function CalendarPage({
  fixtures,
  lastUpdated,
  teamCount = 0,
  teamNames = [],
}: CalendarPageProps) {
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      await refreshCalendarFixtures();
    });
  }
  // Group fixtures by date
  const grouped: GroupedFixtures = {};
  for (const item of fixtures) {
    const date = new Date(item.fixture.date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    // Capitalize first letter
    const capitalizedDate = date.charAt(0).toUpperCase() + date.slice(1);
    if (!grouped[capitalizedDate]) grouped[capitalizedDate] = [];
    grouped[capitalizedDate].push(item);
  }

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white font-[family-name:var(--font-poppins)]">
            Calendrier
          </h1>
          <button
            onClick={handleRefresh}
            disabled={isPending}
            aria-label="Rechercher les matchs"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-5 w-5", isPending && "animate-spin")} />
          </button>
        </div>

        {formattedLastUpdated && (
          <div className="mt-1 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-500" />
            <p className="text-xs text-slate-500">
              Dernière mise à jour : {formattedLastUpdated}
            </p>
          </div>
        )}
      </div>

      {/* Empty state */}
      {fixtures.length === 0 && (
        <div className="rounded-xl bg-[#1e293b] p-6 text-center space-y-3">
          <CalendarDays className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">Aucun match a venir.</p>
          {teamCount === 0 ? (
            <p className="text-xs text-slate-500">
              Suivez des equipes depuis votre profil pour voir leurs prochains
              matchs.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              {teamCount} equipe{teamCount > 1 ? "s" : ""} eligible
              {teamCount > 1 ? "s" : ""} ({teamNames.join(", ")}), mais aucun
              match retourne par l&apos;API.
            </p>
          )}
          <Link
            href="/profile"
            className="inline-block mt-2 text-sm text-[#10b981] hover:text-emerald-300 transition-colors"
          >
            Gerer mes equipes
          </Link>
        </div>
      )}

      {/* Grouped fixtures */}
      {Object.entries(grouped).map(([date, dateFixtures]) => {
        const isToday = date === todayLabel;
        return (
          <div key={date} className="space-y-2">
            <h2
              className={cn(
                "text-center text-xs uppercase tracking-wide font-[family-name:var(--font-poppins)]",
                isToday ? "font-semibold text-emerald-400" : "text-slate-400"
              )}
            >
              {isToday ? `Aujourd'hui · ${date}` : date}
            </h2>

            {dateFixtures.map((item) => (
              <FixtureCard key={item.fixture.id} item={item} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// --- Fixture Card ---

function FixtureCard({
  item,
}: {
  item: {
    fixture: CachedFixture;
    teamSubject: string;
    activeSeries: ActiveSeriesInfo[];
  };
}) {
  const { fixture, activeSeries } = item;
  const hasSeries = activeSeries.length > 0;
  const time = new Date(fixture.date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "rounded-xl bg-[#1e293b] p-3 space-y-2.5",
        hasSeries && "border border-emerald-500/30"
      )}
    >
      {/* League + Time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {fixture.leagueLogo && (
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 p-0.5">
              <img
                src={fixture.leagueLogo}
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          )}
          <span className="text-xs text-slate-400 truncate max-w-[180px]">
            {fixture.league}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-300">{time}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-around gap-2">
        {/* Home */}
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <TeamLogo logoUrl={fixture.homeLogo} size="lg" />
          <span className="text-xs text-white line-clamp-2">
            {fixture.homeTeam}
          </span>
        </div>

        {/* VS */}
        <span className="shrink-0 text-xs font-bold text-slate-500">VS</span>

        {/* Away */}
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <TeamLogo logoUrl={fixture.awayLogo} size="lg" />
          <span className="text-xs text-white line-clamp-2">
            {fixture.awayTeam}
          </span>
        </div>
      </div>

      {/* Active series linked to this fixture */}
      {activeSeries.length > 0 && (
        <div className="border-t border-slate-700/50 pt-2 space-y-1.5">
          {activeSeries.map((s) => (
            <Link
              key={s.id}
              href={`/series/${s.id}`}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0f172a] hover:bg-slate-800 transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5 text-[#10b981] flex-shrink-0" />
              <span className="text-xs text-white truncate">{s.subject}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300">
                {BET_TYPES[s.bet_type as keyof typeof BET_TYPES] ?? s.bet_type}
              </span>
              <span className="text-[10px] text-slate-500 ml-auto">
                {s.target_gain}€/pari
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
