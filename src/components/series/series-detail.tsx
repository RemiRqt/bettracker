import type { SeriesWithBets, BetType, SeriesStatus } from "@/lib/types";
import { BET_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { RollingNumber } from "@/components/ui/rolling-number";
import { SeriesStatusBadge } from "@/components/series/series-status-badge";
import { AbandonDialog } from "@/components/series/abandon-dialog";
import { DeleteSeriesButton } from "@/components/series/delete-series-button";
import { BetsTable } from "@/components/bets/bets-table";
import { AddBetForm } from "@/components/bets/add-bet-form";
import { ValidateResultForm } from "@/components/bets/validate-result-form";

interface SeriesDetailProps {
  series: SeriesWithBets;
}

const STATUS_BORDER: Record<SeriesStatus, string> = {
  en_cours: "border-blue-500/30",
  gagnee: "border-emerald-500/30",
  abandonnee: "border-red-500/30",
};

function StatTile({
  label,
  value,
  color = "text-slate-100",
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-[#0f172a] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={cn("text-sm md:text-base font-bold", color)}>{value}</p>
    </div>
  );
}

export function SeriesDetail({ series }: SeriesDetailProps) {
  const betTypeLabel = BET_TYPES[series.bet_type as BetType] ?? series.bet_type;
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
  const miseCumulee = bets.reduce((sum, b) => sum + b.stake, 0);

  const showAddBetForm = isEnCours && (bets.length === 0 || lastBetHasResult);
  const showValidateForm =
    isEnCours && lastBet !== null && lastBet.result === null;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Hero serie */}
      <div
        className={cn(
          "rounded-2xl bg-[#1e293b] p-4 md:p-5 shadow-hard border",
          STATUS_BORDER[status]
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-xl md:text-2xl font-bold text-slate-100 leading-tight">
            {series.subject}
          </h1>
          <SeriesStatusBadge status={status} />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {betTypeLabel} · Créée le {createdAt}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatTile
            label="Objectif/pari"
            value={<RollingNumber value={series.target_gain} format="euros" />}
            color="text-emerald-400"
          />
          <StatTile
            label="Mise cumulée"
            value={<RollingNumber value={miseCumulee} format="euros" />}
          />
          <StatTile
            label="Paris"
            value={<RollingNumber value={bets.length} format="int" />}
          />
        </div>

        {showValidateForm && lastBet && (
          <div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
            <span className="text-xs text-slate-300">
              Gain potentiel net si gagné
            </span>
            <RollingNumber
              value={lastBet.potential_net}
              format="euros"
              className="text-base font-bold text-emerald-400"
            />
          </div>
        )}

        {isEnCours && (
          <div className="mt-3">
            {bets.length === 0 ? (
              <DeleteSeriesButton seriesId={series.id} />
            ) : (
              <AbandonDialog seriesId={series.id} />
            )}
          </div>
        )}
      </div>

      {/* Paris */}
      <div className="rounded-2xl bg-[#1e293b] p-4 md:p-5 shadow-hard-sm border border-slate-700/50">
        <h2 className="mb-3 text-base md:text-lg font-bold text-slate-100">
          Paris
        </h2>
        <div className="space-y-5">
          <BetsTable bets={bets} />

          {showAddBetForm && <AddBetForm seriesId={series.id} />}

          {showValidateForm && lastBet && (
            <ValidateResultForm
              betId={lastBet.id}
              stake={lastBet.stake}
              potentialNet={lastBet.potential_net}
            />
          )}
        </div>
      </div>
    </div>
  );
}
