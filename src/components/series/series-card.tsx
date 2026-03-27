import Link from "next/link";
import type { Series, BetType } from "@/lib/types";
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

interface SeriesCardProps {
  series: Series;
}

export function SeriesCard({ series }: SeriesCardProps) {
  const betTypeLabel = BET_TYPES[series.bet_type as BetType] ?? series.bet_type;
  const createdAt = new Date(series.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link href={`/series/${series.id}`}>
      <Card className="transition-colors hover:border-primary/50 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{series.subject}</CardTitle>
            <SeriesStatusBadge status={series.status as any} />
          </div>
          <CardDescription>{betTypeLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Objectif : {formatEuros(series.target_gain)}
            </span>
            <span className="text-muted-foreground">{createdAt}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
