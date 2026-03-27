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
      <p className="text-muted-foreground text-center py-8">
        Aucun pari pour le moment.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">#</TableHead>
          <TableHead>Cote</TableHead>
          <TableHead>Mise</TableHead>
          <TableHead>Gain potentiel net</TableHead>
          <TableHead>Résultat</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bets.map((bet) => (
          <TableRow key={bet.id}>
            <TableCell className="font-medium">{bet.bet_number}</TableCell>
            <TableCell>{bet.odds.toFixed(2)}</TableCell>
            <TableCell>{formatEuros(bet.stake)}</TableCell>
            <TableCell>{formatEuros(bet.potential_net)}</TableCell>
            <TableCell>
              <ResultBadge result={bet.result} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ResultBadge({ result }: { result: string | null }) {
  if (result === null) {
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        En attente
      </Badge>
    );
  }

  if (result === "gagne") {
    return (
      <Badge className="bg-green-600 text-white hover:bg-green-600/80">
        {BET_RESULTS.gagne}
      </Badge>
    );
  }

  return (
    <Badge variant="destructive">
      {BET_RESULTS.perdu}
    </Badge>
  );
}
