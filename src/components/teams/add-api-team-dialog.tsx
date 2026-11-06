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
    <Popup
      ouvert={open}
      fermer={fermer}
      niveau={niveau}
      titre="Ajouter une equipe"
      description="Choisis une competition puis l'equipe (recupere le logo)"
    >
      <Corps fermer={fermer} onTeamAdded={onTeamAdded} existingApiTeamIds={existingApiTeamIds} />
    </Popup>
  );
}

/** Monté à chaque ouverture (contenu de la Popup démonté à la fermeture) : repart de zéro. */
function Corps({
  fermer,
  onTeamAdded,
  existingApiTeamIds,
}: {
  fermer: () => void;
  onTeamAdded?: (team: ApiTeamAdded) => void;
  existingApiTeamIds: number[];
}) {
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
          if (comp) loadCompetitionTeams(comp.code);
        }}
      />

      {/* Filter within loaded teams */}
      {clubResults.length > 0 && (
        <div className="relative">
          <Search aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            placeholder="Filtrer..."
            aria-label="Filtrer les équipes"
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      <div className="max-h-72 overflow-y-auto space-y-1">
        {isSearching && (
          <div className="flex items-center justify-center py-6">
            <Loader2 aria-hidden className="h-5 w-5 motion-safe:animate-spin text-muted-foreground" />
            <span className="sr-only">Chargement des équipes…</span>
          </div>
        )}
        {!isSearching && selectedCompetition && clubResults.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune equipe trouvee</p>
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
                alreadyAdded ? "opacity-50 cursor-not-allowed" : "hover:bg-background"
              )}
            >
              <img src={club.logo} alt="" className="h-8 w-8 object-contain rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{club.name}</p>
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
