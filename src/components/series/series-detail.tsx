import type { SeriesWithBets, BetType, SeriesStatus } from "@/lib/types";
import { BET_TYPES } from "@/lib/constants";
import { formatEuros } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { SeriesStatusBadge } from "@/components/series/series-status-badge";
import { AbandonDialog } from "@/components/series/abandon-dialog";
import { BetsTable } from "@/components/bets/bets-table";
import { AddBetForm } from "@/components/bets/add-bet-form";
import { ValidateResultForm } from "@/components/bets/validate-result-form";

interface SeriesDetailProps {
  series: SeriesWithBets;
}

export function SeriesDetail({ series }: SeriesDetailProps) {
  const betTypeLabel =
    BET_TYPES[series.bet_type as BetType] ?? series.bet_type;
  const createdAt = new Date(series.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const status = series.status as SeriesStatus;
  const isEnCours = status === "en_cours";
  const bets = series.bets;
  const lastBet = bets.length > 0 ? bets[bets.length - 1] : null;
  const lastBetHasResult = lastBet !== null && lastBet.result !== null;

  const showAddBetForm = isEnCours && (bets.length === 0 || lastBetHasResult);
  const showValidateForm =
    isEnCours && lastBet !== null && lastBet.result === null;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* En-tete de la serie */}
      <Card className="border-0 bg-[#1e293b] shadow-lg">
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-lg md:text-2xl text-slate-100 leading-tight">
                {series.subject}
              </CardTitle>
            </div>
            <SeriesStatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          {/* Info pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs md:text-sm text-slate-300">
              {betTypeLabel}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs md:text-sm text-slate-300">
              Objectif : <span className="ml-1 text-emerald-400 font-medium">{formatEuros(series.target_gain)}</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs md:text-sm text-slate-300">
              Créée le {createdAt}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs md:text-sm text-slate-300">
              {bets.length} pari{bets.length !== 1 ? "s" : ""}
            </span>
          </div>

          {isEnCours && (
            <AbandonDialog seriesId={series.id} />
          )}
        </CardContent>
      </Card>

      {/* Section paris */}
      <Card className="border-0 bg-[#1e293b] shadow-lg overflow-hidden">
        <div className="h-1 bg-emerald-500" />
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg text-slate-100">
            Paris
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0 space-y-5">
          <BetsTable bets={bets} />

          {showAddBetForm && <AddBetForm seriesId={series.id} />}

          {showValidateForm && lastBet && (
            <ValidateResultForm
              betId={lastBet.id}
              stake={lastBet.stake}
              potentialNet={lastBet.potential_net}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
