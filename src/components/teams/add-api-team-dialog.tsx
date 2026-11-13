"use client";

import { useState, useCallback } from "react";
import { addClub } from "@/actions/teams";
import { FOOTBALL_DATA_COMPETITIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Popup } from "@/components/kit/Popup";
import { Puces } from "@/components/kit/Puces";
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
  /** 1 (défaut) : ouverte depuis une autre popup (formulaire de pari) → passe au-dessus. */
  niveau?: 0 | 1;
}

const libelleCompetition = (c: (typeof FOOTBALL_DATA_COMPETITIONS)[number]) => `${c.flag} ${c.name}`;

// Ajout d'une équipe depuis football-data : compétition → équipe (avec logo).
export function AddApiTeamDialog({ open, onOpenChange, onTeamAdded, existingApiTeamIds = [], niveau = 1 }: AddApiTeamDialogProps) {
  const fermer = () => onOpenChange(false);
  return (
    <Popup ouvert={open} fermer={fermer} niveau={niveau} titre="Ajouter une equipe" description="Choisis une competition puis l'equipe (recupere le logo)">
      <Corps fermer={fermer} onTeamAdded={onTeamAdded} existingApiTeamIds={existingApiTeamIds} />
    </Popup>
  );
}

/** Monté à chaque ouverture (contenu de la Popup démonté à la fermeture) : repart de zéro. */
function Corps({ fermer, onTeamAdded, existingApiTeamIds }: { fermer: () => void; onTeamAdded?: (team: ApiTeamAdded) => void; existingApiTeamIds: number[] }) {
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
      const res = await fetch(`/api/football/search?competition=${encodeURIComponent(code)}`);
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
    const res = await addClub(club.id, club.name, club.logo, isWC ? { kind: "national", country: club.name } : undefined);
    setAdding(null);

    // addClub -> { success } | { error }. On notifie aussi si "deja ajoutee".
    if (res && "error" in res && res.error && !String(res.error).includes("deja")) {
      return;
    }

    onTeamAdded?.({ subject: club.name, apiTeamId: club.id, logoUrl: club.logo, kind, country });
    fermer();
  }

  const filtered = clubResults.filter((c) => !clubFilter || c.name.toLowerCase().includes(clubFilter.toLowerCase()));
  const competitionActive = FOOTBALL_DATA_COMPETITIONS.find((c) => c.code === selectedCompetition);

  return (
    <div className="space-y-3">
      <Puces
        libelle="Compétition"
        options={FOOTBALL_DATA_COMPETITIONS.map(libelleCompetition)}
        selection={competitionActive ? [libelleCompetition(competitionActive)] : []}
        surChoix={(option) => {
          const comp = FOOTBALL_DATA_COMPETITIONS.find((c) => libelleCompetition(c) === option);
          if (comp) void loadCompetitionTeams(comp.code);
        }}
      />

      {/* Filter within loaded teams */}
      {clubResults.length > 0 && (
        <div className="relative">
          <Search aria-hidden className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            placeholder="Filtrer..."
            aria-label="Filtrer les équipes"
            className="w-full rounded-xl border border-border bg-background py-2.5 pr-4 pl-9 text-base text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
      )}

      <div className="max-h-72 space-y-1 overflow-y-auto">
        {isSearching && (
          <div className="flex items-center justify-center py-6">
            <Loader2 aria-hidden className="h-5 w-5 text-muted-foreground motion-safe:animate-spin" />
            <span className="sr-only">Chargement des équipes…</span>
          </div>
        )}
        {!isSearching && selectedCompetition && clubResults.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucune equipe trouvee</p>
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
                "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors",
                alreadyAdded ? "cursor-not-allowed opacity-50" : "hover:bg-background",
              )}
            >
              <img src={club.logo} alt="" className="h-8 w-8 rounded-full object-contain" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{club.name}</p>
              </div>
              {adding === club.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {alreadyAdded && <span className="text-xs text-primary">Ajoutee</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
