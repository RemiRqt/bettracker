import type { ApiTeamAdded } from "@/components/teams/add-api-team-dialog";

export interface ExistingSubject {
  subject: string;
  betType: string;
  sport: string;
  lastStatus: string;
  logoUrl?: string;
  apiTeamId?: number | null;
  activeSeries?: {
    id: string;
    targetGain: number;
    betCount: number;
    sumStakes: number;
  };
}

export interface TeamMappingLite {
  subject: string;
  apiTeamId: number | null;
  logoUrl: string | null;
  sport: string;
}

export interface LockedSeries {
  seriesId: string;
  subject: string;
  betType: string;
  sport: string;
  targetGain: number;
  betCount: number;
  sumStakes: number;
  apiTeamId?: number | null;
}

export interface BetFormProps {
  existingSubjects: ExistingSubject[];
  teamMappings: TeamMappingLite[];
  lockedSeries?: LockedSeries;
  prefill?: { subject: string; betType?: string; sport?: string };
  onSuccess?: () => void;
}

/** resume : on continue une série active ; serie : nouvelle série ; unique : pari isolé. */
export type BetMode = "resume" | "serie" | "unique";

export type { ApiTeamAdded };
