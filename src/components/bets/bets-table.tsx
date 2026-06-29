import { Bet } from "@/lib/types";
import { BET_RESULTS } from "@/lib/constants";
import { formatEuros } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface BetsTableProps {
  bets: Bet[];
}

export function BetsTable({ bets }: BetsTableProps) {
  if (bets.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8 text-sm">
        Aucun pari pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {bets.map((bet) => (
        <div
          key={bet.id}
          className="flex items-center gap-3 rounded-lg bg-card/60 p-3"
        >
          {/* Numero du pari */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {bet.bet_number}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Cote{" "}
                <span className="text-secondary-foreground font-medium">
                  {bet.odds.toFixed(2)}
                </span>
              </span>
              <ResultBadge result={bet.result} />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">
                Mise :{" "}
                <span className="text-secondary-foreground font-medium">
                  {formatEuros(bet.stake)}
                </span>
              </span>
              <span className="text-muted-foreground">
                Net :{" "}
                <span className="text-primary font-medium">
                  {formatEuros(bet.potential_net)}
                </span>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultBadge({ result }: { result: string | null }) {
  if (result === null) {
    return (
      <Badge
        variant="secondary"
        className="bg-muted text-secondary-foreground text-[10px] md:text-xs"
      >
        En attente
      </Badge>
    );
  }

  if (result === "gagne") {
    return (
      <Badge className="bg-primary/20 text-primary hover:bg-primary/30 text-[10px] md:text-xs">
        {BET_RESULTS.gagne}
      </Badge>
    );
  }

  return (
    <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 text-[10px] md:text-xs">
      {BET_RESULTS.perdu}
    </Badge>
  );
}
