import type { SeriesStatus } from "@/lib/types";
import { SERIES_STATUSES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DARK_STATUS_COLORS: Record<SeriesStatus, string> = {
  en_cours: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  gagnee: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  abandonnee: "bg-red-500/20 text-red-400 border-red-500/30",
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
