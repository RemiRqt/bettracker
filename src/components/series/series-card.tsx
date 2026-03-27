import Link from "next/link";
import type { Series, BetType } from "@/lib/types";
import { BET_TYPES } from "@/lib/constants";
import { formatEuros } from "@/lib/utils";
import { SeriesStatusBadge } from "@/components/series/series-status-badge";

interface SeriesCardProps {
  series: Series;
}

function statusBorderColor(status: string) {
  switch (status) {
    case "gagnee":
      return "border-l-emerald-500";
    case "en_cours":
      return "border-l-blue-500";
    case "abandonnee":
      return "border-l-red-500";
    default:
      return "border-l-slate-500";
  }
}

export function SeriesCard({ series }: SeriesCardProps) {
  const betTypeLabel = BET_TYPES[series.bet_type as BetType] ?? series.bet_type;
  const createdAt = new Date(series.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={`/series/${series.id}`}>
      <div
        className={`
          rounded-lg border-0 border-l-4 bg-[#1e293b] p-3 md:p-4 shadow-lg
          transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl hover:bg-[#253348]
          ${statusBorderColor(series.status)}
        `}
      >
        {/* Ligne 1 : sujet + badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm md:text-base font-semibold text-slate-100 leading-tight line-clamp-2">
            {series.subject}
          </h3>
          <SeriesStatusBadge status={series.status as any} />
        </div>

        {/* Ligne 2 : type + objectif */}
        <div className="flex items-center gap-3 text-xs md:text-sm text-slate-400 mb-2">
          <span>{betTypeLabel}</span>
          <span className="text-slate-600">|</span>
          <span>
            Objectif : <span className="text-emerald-400 font-medium">{formatEuros(series.target_gain)}</span>
          </span>
        </div>

        {/* Ligne 3 : date */}
        <p className="text-[11px] md:text-xs text-slate-500">{createdAt}</p>
      </div>
    </Link>
  );
}
