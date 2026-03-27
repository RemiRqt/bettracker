import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEuros } from "@/lib/utils";
import { BET_TYPES } from "@/lib/constants";

interface ActiveSeriesRiskProps {
  activeSeries: {
    id: string;
    subject: string;
    bet_type: string;
    target_gain: number;
    cumulativeStake: number;
    bets: { stake: number }[];
  }[];
}

export function ActiveSeriesRisk({ activeSeries }: ActiveSeriesRiskProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Séries en cours - Exposition</CardTitle>
      </CardHeader>
      <CardContent>
        {activeSeries.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune série en cours
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sujet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Objectif</TableHead>
                <TableHead>Mise cumulée</TableHead>
                <TableHead>Nb paris</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSeries.map((series) => (
                <TableRow key={series.id}>
                  <TableCell>
                    <Link
                      href={`/series/${series.id}`}
                      className="font-medium hover:underline"
                    >
                      {series.subject}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {BET_TYPES[series.bet_type as keyof typeof BET_TYPES] ??
                      series.bet_type}
                  </TableCell>
                  <TableCell>{formatEuros(series.target_gain)}</TableCell>
                  <TableCell>{formatEuros(series.cumulativeStake)}</TableCell>
                  <TableCell>{series.bets.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
