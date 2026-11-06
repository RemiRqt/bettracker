"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEquipe, updateEquipeSport } from "@/actions/equipes";
import { validateResult } from "@/actions/bet-results";
import { fireConfetti } from "@/lib/confetti";
import { useBetModal } from "@/components/paris/bet-modal-provider";
import { FollowedTeams } from "@/components/profile/followed-teams";
import { EquipeCard, type MergedEquipe } from "./equipe-card";
import type { TeamMapping } from "@/actions/teams";
import { Popup } from "@/components/kit/Popup";
import { EtatVide } from "@/components/kit/EtatVide";
import { EquipesToolbar, type SortKey, type FilterKey } from "./equipes-toolbar";
import { EditSportPopup } from "./edit-sport-popup";

interface EquipesPageProps {
  equipes: MergedEquipe[];
  logoMap: Record<string, string>;
  nextFixtureMap?: Record<string, { date: string }>;
  teamMappings?: TeamMapping[];
}

export function EquipesPage({ equipes, logoMap, nextFixtureMap = {}, teamMappings = [] }: EquipesPageProps) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Filters & sort
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterBy, setFilterBy] = useState<FilterKey>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchOpen, setSearchOpen] = useState(false);
  const [myTeamsOpen, setMyTeamsOpen] = useState(false);
  const [editEquipe, setEditEquipe] = useState<MergedEquipe | null>(null);
  const [seriesShowAll, setSeriesShowAll] = useState<Set<string>>(new Set());

  const { open: openBetModal } = useBetModal();

  // === Sort/Filter logic ===

  function handleSort(key: SortKey) {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  }

  const counts = useMemo(() => {
    const c = { en_cours: 0, gagne: 0, perdu: 0 };
    for (const eq of equipes) {
      if (eq.enCoursCount > 0) c.en_cours++;
      if (eq.netProfit > 0) c.gagne++;
      if (eq.netProfit < 0) c.perdu++;
    }
    return c;
  }, [equipes]);

  const filtered = equipes.filter((eq) => {
    if (!eq.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterBy === null) return true;
    switch (filterBy) {
      case "en_cours": return eq.enCoursCount > 0;
      case "gagne": return eq.netProfit > 0;
      case "perdu": return eq.netProfit < 0;
    }
  });

  const sorted = [...filtered].sort((a, b) => {
    // séries en cours toujours en haut
    const aActive = a.activeSeries ? 0 : 1;
    const bActive = b.activeSeries ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;

    let cmp = 0;
    switch (sortBy) {
      case "date": cmp = b.lastBetDate.localeCompare(a.lastBetDate); break;
      case "gains": cmp = b.netProfit - a.netProfit; break;
      case "paris": cmp = b.betsCount - a.betsCount; break;
    }
    return sortAsc ? -cmp : cmp;
  });

  function toggleExpand(key: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleSeriesShowAll(key: string) {
    setSeriesShowAll((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }


  function handleValidate(betId: string, result: "gagne" | "perdu") {
    startTransition(async () => {
      const res = await validateResult(betId, result);
      if (result === "gagne" && !res?.error) fireConfetti();
    });
  }

  const renderCard = (eq: MergedEquipe, keyPrefix: string) => {
    const cardKey = `${keyPrefix}${eq.name}:::${eq.bet_type}`;
    return (
      <EquipeCard
        key={cardKey}
        eq={eq}
        logoMap={logoMap}
        nextFixture={nextFixtureMap[eq.name]}
        isExpanded={expandedIds.has(cardKey)}
        showAllSeries={seriesShowAll.has(cardKey)}
        onToggleExpand={() => toggleExpand(cardKey)}
        onToggleShowAllSeries={() => toggleSeriesShowAll(cardKey)}
        onEdit={() => setEditEquipe(eq)}
        onOpenBet={() => openBetModal({ subject: eq.name, betType: eq.bet_type, sport: eq.sport })}
        onValidate={handleValidate}
        onDeleteEmpty={async () => {
          await deleteEquipe(eq.equipeId);
          startTransition(() => { router.refresh(); });
        }}
      />
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="sr-only">Mes équipes</h1>
      <EquipesToolbar
        search={search}
        onSearch={setSearch}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen((o) => !o)}
        filterBy={filterBy}
        onFilter={setFilterBy}
        counts={counts}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSort={handleSort}
        onOpenMyTeams={() => setMyTeamsOpen(true)}
      />

      {/* List */}
      {sorted.length === 0 ? (
        <EtatVide>Aucune équipe trouvée.</EtatVide>
      ) : (
        <div className="space-y-2">
          {sorted.map((eq) => renderCard(eq, ""))}
        </div>
      )}

      <Popup
        ouvert={myTeamsOpen}
        fermer={() => setMyTeamsOpen(false)}
        titre="Mes équipes"
        description="Ajoute des équipes API et gère tes favoris"
      >
        <FollowedTeams teamMappings={teamMappings} />
      </Popup>

      <EditSportPopup
        equipe={editEquipe}
        fermer={() => setEditEquipe(null)}
        surChoix={async (equipe, sport) => {
          await updateEquipeSport(equipe.equipeId, sport);
          setEditEquipe(null);
          startTransition(() => { router.refresh(); });
        }}
      />
    </div>
  );
}
