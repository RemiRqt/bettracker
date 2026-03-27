import type { SeriesWithBets, BetType, SeriesStatus } from "@/lib/types";
import { BET_TYPES } from "@/lib/constants";
import { formatEuros } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{series.subject}</CardTitle>
              <CardDescription className="mt-1">{betTypeLabel}</CardDescription>
            </div>
            <SeriesStatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Objectif de gain : </span>
              <span className="font-medium">
                {formatEuros(series.target_gain)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Creee le : </span>
              <span className="font-medium">{createdAt}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Paris : </span>
              <span className="font-medium">{bets.length}</span>
            </div>
          </div>

          {isEnCours && (
            <div className="mt-6">
              <AbandonDialog seriesId={series.id} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paris</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
