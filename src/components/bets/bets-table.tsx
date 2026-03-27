import { Bet } from "@/lib/types";
import { BET_RESULTS } from "@/lib/constants";
import { formatEuros } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BetsTableProps {
  bets: Bet[];
}

export function BetsTable({ bets }: BetsTableProps) {
  if (bets.length === 0) {
    return (
      <p className="text-slate-500 text-center py-8 text-sm">
        Aucun pari pour le moment.
      </p>
    );
  }

  return (
    <>
      {/* Vue mobile : cartes empilees */}
      <div className="space-y-2 md:hidden">
        {bets.map((bet) => (
          <div
            key={bet.id}
            className="flex items-center gap-3 rounded-lg bg-slate-800/60 p-3"
          >
            {/* Numero du pari */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
              {bet.bet_number}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  Cote <span className="text-slate-200 font-medium">{bet.odds.toFixed(2)}</span>
                </span>
                <ResultBadge result={bet.result} />
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  Mise : <span className="text-slate-200 font-medium">{formatEuros(bet.stake)}</span>
                </span>
                <span className="text-slate-400">
                  Net : <span className="text-emerald-400 font-medium">{formatEuros(bet.potential_net)}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vue desktop : tableau */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="w-16 text-slate-400">#</TableHead>
              <TableHead className="text-slate-400">Cote</TableHead>
              <TableHead className="text-slate-400">Mise</TableHead>
              <TableHead className="text-slate-400">Gain potentiel net</TableHead>
              <TableHead className="text-slate-400">Résultat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bets.map((bet) => (
              <TableRow key={bet.id} className="border-slate-700/50 hover:bg-slate-800/50">
                <TableCell className="font-medium text-slate-200">{bet.bet_number}</TableCell>
                <TableCell className="text-slate-300">{bet.odds.toFixed(2)}</TableCell>
                <TableCell className="text-slate-300">{formatEuros(bet.stake)}</TableCell>
                <TableCell className="text-emerald-400">{formatEuros(bet.potential_net)}</TableCell>
                <TableCell>
                  <ResultBadge result={bet.result} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function ResultBadge({ result }: { result: string | null }) {
  if (result === null) {
    return (
      <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-[10px] md:text-xs">
        En attente
      </Badge>
    );
  }

  if (result === "gagne") {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] md:text-xs">
        {BET_RESULTS.gagne}
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[10px] md:text-xs">
      {BET_RESULTS.perdu}
    </Badge>
  );
}
