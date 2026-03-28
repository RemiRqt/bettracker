"use client";

import { useTransition } from "react";
import type { CachedFixture } from "@/actions/teams";
import { refreshCalendarFixtures } from "@/actions/teams";
import { TeamLogo } from "@/components/ui/team-logo";
import { CalendarDays, Clock, TicketPlus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CalendarPageProps {
  fixtures: { fixture: CachedFixture; teamSubject: string }[];
  lastUpdated: string | null;
  teamCount?: number;
  teamNames?: string[];
}

interface GroupedFixtures {
  [date: string]: { fixture: CachedFixture; teamSubject: string }[];
}

export function CalendarPage({ fixtures, lastUpdated, teamCount = 0, teamNames = [] }: CalendarPageProps) {
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
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400">
              {fixtures.length} match{fixtures.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={handleRefresh}
              disabled={isPending}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors disabled:opacity-50"
              title="Rechercher les matchs"
            >
              <RefreshCw className={cn("h-4 w-4 text-slate-400", isPending && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Last updated */}
        {formattedLastUpdated && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-700">
            <Clock className="h-3 w-3 text-slate-500" />
            <p className="text-xs text-slate-500">
              Derniere mise a jour : {formattedLastUpdated}
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
              matchs. Les equipes doivent etre liees a l&apos;API Football et
              suivies (ou dans une serie active).
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              {teamCount} equipe{teamCount > 1 ? "s" : ""} eligible{teamCount > 1 ? "s" : ""} ({teamNames.join(", ")}), mais aucun match retourne par l&apos;API.
              Verifiez les logs serveur pour plus de details.
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
      {Object.entries(grouped).map(([date, dateFixtures]) => (
        <div key={date} className="space-y-2">
          <h2 className="text-xs uppercase tracking-wide text-slate-400 px-1 font-[family-name:var(--font-poppins)]">
            {date}
          </h2>

          {dateFixtures.map((item) => (
            <FixtureCard key={item.fixture.id} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Fixture Card ---

function FixtureCard({
  item,
}: {
  item: { fixture: CachedFixture; teamSubject: string };
}) {
  const { fixture } = item;
  const time = new Date(fixture.date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl bg-[#1e293b] p-3 space-y-2.5">
      {/* League + Time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {fixture.leagueLogo && (
            <img
              src={fixture.leagueLogo}
              alt=""
              className="h-4 w-4 object-contain"
            />
          )}
          <span className="text-xs text-slate-400 truncate max-w-[180px]">
            {fixture.league}
          </span>
        </div>
        <span className="text-xs font-medium text-slate-300">{time}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-sm text-white truncate text-right">
            {fixture.homeTeam}
          </span>
          <TeamLogo logoUrl={fixture.homeLogo} size="sm" />
        </div>

        {/* VS */}
        <span className="text-xs font-bold text-slate-500 px-1">VS</span>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          <TeamLogo logoUrl={fixture.awayLogo} size="sm" />
          <span className="text-sm text-white truncate">
            {fixture.awayTeam}
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
