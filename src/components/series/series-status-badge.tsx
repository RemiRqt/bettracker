import type { SeriesStatus } from "@/lib/types";
import { SERIES_STATUSES, STATUS_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface SeriesStatusBadgeProps {
  status: SeriesStatus;
}

export function SeriesStatusBadge({ status }: SeriesStatusBadgeProps) {
  return (
    <Badge className={STATUS_COLORS[status]}>
      {SERIES_STATUSES[status]}
    </Badge>
  );
}
