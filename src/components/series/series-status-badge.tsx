import type { SeriesStatus } from "@/lib/types";
import { SERIES_STATUSES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DARK_STATUS_COLORS: Record<SeriesStatus, string> = {
  en_cours: "bg-info/20 text-info border-info/30",
  gagnee: "bg-primary/20 text-primary border-primary/30",
  abandonnee: "bg-destructive/20 text-destructive border-destructive/30",
};

interface SeriesStatusBadgeProps {
  status: SeriesStatus;
}

export function SeriesStatusBadge({ status }: SeriesStatusBadgeProps) {
  return (
    <Badge className={cn("text-[10px] px-1.5 py-0", DARK_STATUS_COLORS[status])}>
      {SERIES_STATUSES[status]}
    </Badge>
  );
}
