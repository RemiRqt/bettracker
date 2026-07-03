"use client";

import { useState, useCallback } from "react";
import { addClub } from "@/actions/teams";
import { FOOTBALL_DATA_COMPETITIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";

interface ApiTeamResult {
  id: number;
  name: string;
  country: string | null;
  logo: string;
}

export interface ApiTeamAdded {
  subject: string;
  apiTeamId: number;
  logoUrl: string;
  kind: "club" | "national";
  country: string | null;
}

interface AddApiTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamAdded?: (team: ApiTeamAdded) => void;
  existingApiTeamIds?: number[];
}

export function AddApiTeamDialog({
  open,
  onOpenChange,
  onTeamAdded,
  existingApiTeamIds = [],
}: AddApiTeamDialogProps) {
  const [selectedCompetition, setSelectedCompetition] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [clubResults, setClubResults] = useState<ApiTeamResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);

  const loadCompetitionTeams = useCallback(async (code: string) => {
    if (!code) return;
    setSelectedCompetition(code);
    setIsSearching(true);
    setClubResults([]);
    setClubFilter("");
    try {
      const res = await fetch(
        `/api/football/search?competition=${encodeURIComponent(code)}`
      );
      if (res.ok) {
        const data = await res.json();
        setClubResults(Array.isArray(data) ? data : []);
      }
    } catch {
      setClubResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  async function handleAdd(club: ApiTeamResult) {
    if (existingApiTeamIds.includes(club.id) || adding !== null) return;
    const isWC = selectedCompetition === "WC";
    const kind: "club" | "national" = isWC ? "national" : "club";
    const country = isWC ? club.name : null;

    setAdding(club.id);
    const res = await addClub(
      club.id,
      club.name,
      club.logo,
      isWC ? { kind: "national", country: club.name } : undefined
    );
    setAdding(null);

    // addClub -> { success } | { error }. On notifie aussi si "deja ajoutee".
    if (res && "error" in res && res.error && !String(res.error).includes("deja")) {
      return;
    }

    onTeamAdded?.({
      subject: club.name,
      apiTeamId: club.id,
      logoUrl: club.logo,
      kind,
      country,
    });
    setSelectedCompetition("");
    setClubResults([]);
    setClubFilter("");
    onOpenChange(false);
  }

  const filtered = clubResults.filter(
    (c) => !clubFilter || c.name.toLowerCase().includes(clubFilter.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border text-foreground max-w-md mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Ajouter une equipe</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choisis une competition puis l&apos;equipe (recupere le logo)
          </DialogDescription>
        </DialogHeader>

        {/* Competition picker */}
        <div className="flex flex-wrap gap-1.5">
          {FOOTBALL_DATA_COMPETITIONS.map((comp) => (
            <button
              key={comp.code}
              type="button"
              onClick={() => loadCompetitionTeams(comp.code)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                selectedCompetition === comp.code
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              {comp.flag} {comp.name}
            </button>
          ))}
        </div>

        {/* Filter within loaded teams */}
        {clubResults.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={clubFilter}
              onChange={(e) => setClubFilter(e.target.value)}
              placeholder="Filtrer..."
              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        <div className="max-h-72 overflow-y-auto space-y-1">
          {isSearching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isSearching && selectedCompetition && clubResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune equipe trouvee
            </p>
          )}
          {filtered.map((club) => {
            const alreadyAdded = existingApiTeamIds.includes(club.id);
            return (
              <button
                key={club.id}
                type="button"
                onClick={() => handleAdd(club)}
                disabled={alreadyAdded || adding !== null}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors",
                  alreadyAdded
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-background"
                )}
              >
                <img
                  src={club.logo}
                  alt=""
                  className="h-8 w-8 object-contain rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{club.name}</p>
                </div>
                {adding === club.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {alreadyAdded && <span className="text-xs text-primary">Ajoutee</span>}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
