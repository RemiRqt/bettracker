# Refonte création de paris (Chantier B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les deux flux séparés (créer une série via `SeriesForm`, ajouter un pari via `AddBetForm`) par un form unifié qui, à partir d'un nom, détecte le contexte (reprise série / nouvelle série / pari unique) et calcule mise/objectif automatiquement.

**Architecture:** Un pari unique = une série `kind='unique'` d'un pari (réutilise toute la mécanique série). Nouvelle colonne `series.sport`. Une action serveur unique `createBetEntry` orchestre les 3 modes. Un composant `BetForm` (form body, dialog-agnostic) piloté par une recherche locale, avec ajout d'équipe API inline via un dialog extrait de `followed-teams.tsx`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Supabase (Postgres + RLS), Tailwind v4, Radix/shadcn.

## Global Constraints

- Pas de framework de test dans le projet (`scripts` = dev/build/start/lint). **Vérification par tâche = `npm run lint` + `npm run build`** ; correctness des calculs vérifiée par les exemples chiffrés + le test live final. **Ne PAS introduire de test runner.**
- Fichier ≤ 300 lignes, composant React ≤ 200 lignes, fonction ≤ 30 lignes. Si dépassé → découper.
- Pas de `select *` hors lecture ponctuelle déjà existante ; ne fetch que les champs requis.
- Data flow imposé : Composant → Server Action (`src/actions/`) → Supabase. Jamais de Supabase dans un composant.
- Dark theme slate/emerald, `cn()` pour les classes, réutiliser les primitives shadcn existantes. `SeriesForm` (`src/components/series/series-form.tsx`) et `followed-teams.tsx` sont les templates de style.
- `subject` stocké = **nom canonique API** quand une équipe API est choisie.
- bettracker = perso : commits sur `master`, push direct = auto-deploy Vercel prod. **Merge+deploy à la toute fin (Task 8), pas avant.**
- Supabase partagé (prod, ref `voimkeolnigofzrafkvn`) : la migration 00019 est **additive** (colonnes avec défaut) → non destructive.

---

## File Structure

- **Create** `supabase/migrations/00019_add_series_kind_sport.sql` — colonnes `kind`, `sport`.
- **Modify** `src/lib/types/database.ts` — série Row/Insert/Update + `kind`, `sport`.
- **Create** `src/lib/bet-calc.ts` — math pure (stake/objectif/net). Aucune I/O.
- **Modify** `src/actions/bets.ts` — ajoute `createBetEntry`. `addBet` retiré en Task 7.
- **Create** `src/components/teams/add-api-team-dialog.tsx` — picker compétition→équipe (extrait).
- **Modify** `src/components/profile/followed-teams.tsx` — consomme le dialog extrait.
- **Create** `src/components/paris/bet-form.tsx` — form unifié (body).
- **Create** `src/components/paris/team-search.tsx` — champ nom + dropdown (si `bet-form` > 200 l.).
- **Modify** `src/app/(app)/series/new/page.tsx` — fournit `existingSubjects` + `teamMappings`.
- **Modify** `src/components/paris/paris-page.tsx` — modale → `BetForm` ; badge unique + sport.
- **Modify** `src/components/series/series-detail.tsx` — `AddBetForm` → `BetForm` (mode reprise verrouillé).
- **Delete** `src/components/series/series-form.tsx`, `src/components/bets/add-bet-form.tsx` (Task 7).

**Laissés intacts en B (chantier D) :** `src/components/equipes/equipes-page.tsx` + `placeBet` (equipes.ts), qui ont leur propre flux de placement.

---

## Task 1 : Migration + types (kind, sport)

**Files:**
- Create: `supabase/migrations/00019_add_series_kind_sport.sql`
- Modify: `src/lib/types/database.ts:12-41` (bloc `series`)

**Interfaces:**
- Produces: colonnes `series.kind` (`'serie'|'unique'`, défaut `'serie'`) et `series.sport` (`'football'|'tennis'|'rugby'|'basket'`, défaut `'football'`). Types `Series`/`SeriesInsert` (via `database.ts`) exposent `kind: string` et `sport: string`.

- [ ] **Step 1 : Créer la migration**

Créer `supabase/migrations/00019_add_series_kind_sport.sql` :

```sql
-- Ajoute la nature de la série (serie multi-paris vs pari unique) et le sport.
alter table series
  add column kind  text not null default 'serie'
    check (kind in ('serie','unique')),
  add column sport text not null default 'football'
    check (sport in ('football','tennis','rugby','basket'));

comment on column series.kind  is 'serie = martingale multi-paris ; unique = pari isolé (1 pari)';
comment on column series.sport is 'football | tennis | rugby | basket';
```

- [ ] **Step 2 : Étendre les types générés**

Dans `src/lib/types/database.ts`, bloc `series` (≈ lignes 12-41), ajouter `kind`/`sport` dans `Row`, `Insert`, `Update` :

```ts
        Row: {
          id: string;
          user_id: string;
          subject: string;
          bet_type: string;
          target_gain: number;
          status: string;
          kind: string;
          sport: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          bet_type: string;
          target_gain: number;
          status?: string;
          kind?: string;
          sport?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          bet_type?: string;
          target_gain?: number;
          status?: string;
          kind?: string;
          sport?: string;
          created_at?: string;
        };
```

- [ ] **Step 3 : Appliquer la migration sur Supabase**

Run : `npx supabase db push`
Expected : la migration `00019` est appliquée sans erreur (colonnes ajoutées, séries existantes conservées avec `kind='serie'`, `sport='football'`).

- [ ] **Step 4 : Vérifier build + lint**

Run : `npm run lint && npm run build`
Expected : PASS (types cohérents, aucune erreur).

- [ ] **Step 5 : Commit**

```bash
git add supabase/migrations/00019_add_series_kind_sport.sql src/lib/types/database.ts
git commit -m "feat(bets): series.kind + series.sport (migration 00019)"
```

---

## Task 2 : Helper de calcul pur (`bet-calc.ts`)

**Files:**
- Create: `src/lib/bet-calc.ts`

**Interfaces:**
- Produces :
  - `round2(n: number): number`
  - `computeStake(n: number, targetGain: number, sumPrevStakes: number, odds: number): number`
  - `computePotentialNet(stake: number, odds: number, sumPrevStakes: number): number`
  - `objectiveFromStake(stake: number, odds: number): number`
  - `stakeFromObjective(objective: number, odds: number): number`

- [ ] **Step 1 : Écrire le module pur**

Créer `src/lib/bet-calc.ts` :

```ts
// Calculs de paris — fonctions pures, aucune I/O.
// La martingale : pour le pari #n d'une série visant un gain net T, avec S = somme
// des mises précédentes, on mise (n·T + S)/(cote−1). Un pari unique = cas n=1, S=0.

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Mise martingale pour le pari #n (cible T, somme mises précédentes S). */
export function computeStake(
  n: number,
  targetGain: number,
  sumPrevStakes: number,
  odds: number
): number {
  return round2((n * targetGain + sumPrevStakes) / (odds - 1));
}

/** Gain net si ce pari gagne : mise·cote − mise − S. */
export function computePotentialNet(
  stake: number,
  odds: number,
  sumPrevStakes: number
): number {
  return round2(stake * odds - stake - sumPrevStakes);
}

/** Pari unique : objectif (gain net) depuis la mise → mise·(cote−1). */
export function objectiveFromStake(stake: number, odds: number): number {
  return round2(stake * (odds - 1));
}

/** Pari unique : mise nécessaire pour un objectif → objectif/(cote−1). */
export function stakeFromObjective(objective: number, odds: number): number {
  return round2(objective / (odds - 1));
}
```

Exemples vérifiés (à contrôler au test live, Task 8) :
- `stakeFromObjective(2, 1.5) = 4` ; `objectiveFromStake(4, 1.5) = 2`.
- `computeStake(1, 2, 0, 1.5) = 4` (série pari #1, T=2, cote 1.5) → cohérent avec `stakeFromObjective(2, 1.5)`.
- `computeStake(2, 2, 4, 1.5) = 16` ; `computePotentialNet(16, 1.5, 4) = 4`.

- [ ] **Step 2 : Vérifier build**

Run : `npm run build`
Expected : PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/bet-calc.ts
git commit -m "feat(bets): helper de calcul pur bet-calc"
```

---

## Task 3 : Action serveur `createBetEntry`

**Files:**
- Modify: `src/actions/bets.ts` (ajout en tête, après les imports)

**Interfaces:**
- Consumes : `bet-calc` (Task 2), types Supabase (Task 1).
- Produces :
  ```ts
  type BetMode = "resume" | "serie" | "unique";
  interface CreateBetInput {
    subject: string; betType: string; sport: SportType; mode: BetMode; odds: number;
    targetGain?: number; stake?: number;
    apiTeam?: { apiTeamId: number; crestUrl: string; kind?: "club" | "national"; country?: string };
  }
  createBetEntry(input: CreateBetInput):
    Promise<{ error: string } | { success: true; seriesId: string; stake: number; potential_net: number; bet_number: number }>
  ```

- [ ] **Step 1 : Ajouter les imports en tête de `bets.ts`**

En haut de `src/actions/bets.ts`, après les imports existants :

```ts
import type { SportType } from "@/lib/types";
import {
  round2,
  computeStake,
  computePotentialNet,
  objectiveFromStake,
  stakeFromObjective,
} from "@/lib/bet-calc";
```

- [ ] **Step 2 : Écrire `createBetEntry`**

Ajouter dans `src/actions/bets.ts` :

```ts
type BetMode = "resume" | "serie" | "unique";

interface CreateBetInput {
  subject: string;
  betType: string;
  sport: SportType;
  mode: BetMode;
  odds: number;
  targetGain?: number;
  stake?: number;
  apiTeam?: {
    apiTeamId: number;
    crestUrl: string;
    kind?: "club" | "national";
    country?: string;
  };
}

export async function createBetEntry(input: CreateBetInput) {
  const { subject, betType, sport, mode, odds, apiTeam } = input;

  if (!subject?.trim()) return { error: "Le nom est requis." };
  if (!betType?.trim()) return { error: "Le type de pari est requis." };
  if (!odds || odds <= 1) return { error: "La cote doit etre superieure a 1." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");

  const name = subject.trim();
  let seriesId: string;
  let n: number;
  let sumPrev: number;
  let T: number;

  if (mode === "resume") {
    const { data: active, error: findErr } = await supabase
      .from("series")
      .select("id, target_gain")
      .eq("user_id", user.id)
      .eq("subject", name)
      .eq("bet_type", betType)
      .eq("status", "en_cours")
      .single();
    if (findErr || !active) return { error: "Aucune serie en cours pour cette equipe." };

    seriesId = active.id;
    T = active.target_gain;
    const { data: prev } = await supabase
      .from("bets")
      .select("stake")
      .eq("series_id", seriesId)
      .order("bet_number", { ascending: true });
    n = (prev?.length ?? 0) + 1;
    sumPrev = (prev ?? []).reduce((s, b) => s + b.stake, 0);
  } else {
    let target: number;
    if (mode === "serie") {
      if (!input.targetGain || input.targetGain <= 0)
        return { error: "L'objectif de gain est requis." };
      target = input.targetGain;
    } else {
      // unique : exactement un de { targetGain, stake }
      if (input.targetGain && input.targetGain > 0) target = input.targetGain;
      else if (input.stake && input.stake > 0) target = objectiveFromStake(input.stake, odds);
      else return { error: "Renseigne un objectif ou une mise." };
    }

    const { data: newSeries, error: seriesErr } = await supabase
      .from("series")
      .insert({
        user_id: user.id,
        subject: name,
        bet_type: betType,
        target_gain: target,
        status: "en_cours",
        kind: mode === "unique" ? "unique" : "serie",
        sport,
      })
      .select("id")
      .single();
    if (seriesErr) return { error: `Erreur creation serie: ${seriesErr.message}` };

    await supabase.from("equipes").upsert(
      { user_id: user.id, name, bet_type: betType, sport },
      { onConflict: "user_id,name,bet_type", ignoreDuplicates: true }
    );

    seriesId = newSeries.id;
    T = target;
    n = 1;
    sumPrev = 0;
  }

  const override = input.stake && input.stake > 0 ? round2(input.stake) : null;
  const stake =
    mode === "unique"
      ? override ?? stakeFromObjective(T, odds)
      : override ?? computeStake(n, T, sumPrev, odds);
  const potential_net = computePotentialNet(stake, odds, sumPrev);

  const { error: insertErr } = await supabase.from("bets").insert({
    series_id: seriesId,
    bet_number: n,
    odds,
    stake,
    potential_net,
    result: null,
  });
  if (insertErr) return { error: `Erreur ajout pari: ${insertErr.message}` };

  // Foot : garantir le lien API si une équipe a été choisie (idempotent, cf. addClub)
  if (sport === "football" && apiTeam) {
    const { data: existing } = await supabase
      .from("team_mappings")
      .select("id")
      .eq("user_id", user.id)
      .eq("api_team_id", apiTeam.apiTeamId)
      .eq("is_club", true)
      .maybeSingle();
    let mappingId = existing?.id as string | undefined;
    if (!mappingId) {
      const { data: inserted } = await supabase
        .from("team_mappings")
        .insert({
          user_id: user.id,
          subject: name,
          api_team_id: apiTeam.apiTeamId,
          logo_url: apiTeam.crestUrl,
          sport: "football",
          is_club: true,
          is_followed: false,
          kind: apiTeam.kind ?? "club",
          country: apiTeam.country ?? null,
          provider: "football-data",
        })
        .select("id")
        .single();
      mappingId = inserted?.id;
    }
    if (mappingId) {
      await supabase.from("subject_links").upsert(
        { user_id: user.id, subject: name, team_mapping_id: mappingId },
        { onConflict: "user_id,subject,team_mapping_id", ignoreDuplicates: true }
      );
    }
  }

  revalidatePath("/series");
  revalidatePath(`/series/${seriesId}`);
  revalidatePath("/");
  return { success: true, seriesId, stake, potential_net, bet_number: n };
}
```

- [ ] **Step 3 : Vérifier build + lint**

Run : `npm run lint && npm run build`
Expected : PASS. (`addBet` existe encore, utilisé par `add-bet-form.tsx` jusqu'à Task 7.)

- [ ] **Step 4 : Commit**

```bash
git add src/actions/bets.ts
git commit -m "feat(bets): action unifiee createBetEntry (resume/serie/unique)"
```

---

## Task 4 : Extraire `AddApiTeamDialog`

**Files:**
- Create: `src/components/teams/add-api-team-dialog.tsx`
- Modify: `src/components/profile/followed-teams.tsx` (remplace le dialog inline par le composant)

**Interfaces:**
- Consumes : `addClub` (`@/actions/teams`), `FOOTBALL_DATA_COMPETITIONS` (`@/lib/constants`), `/api/football/search?competition=CODE`.
- Produces :
  ```ts
  interface ApiTeamAdded { subject: string; apiTeamId: number; logoUrl: string }
  interface AddApiTeamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTeamAdded?: (team: ApiTeamAdded) => void; // appelé après addClub réussi
  }
  export function AddApiTeamDialog(props: AddApiTeamDialogProps): JSX.Element
  ```

- [ ] **Step 1 : Créer le composant en déplaçant la logique existante**

Créer `src/components/teams/add-api-team-dialog.tsx`. Déplacer depuis `followed-teams.tsx` (repères actuels : state `addClubOpen`, handler de fetch ligne ~104 `fetch(/api/football/search?competition=...)`, handler `addClub` ligne ~143, et le JSX du dialog « Add club » lignes ~369-460). Le composant encapsule : sélection de compétition (`FOOTBALL_DATA_COMPETITIONS`), fetch des équipes, champ de filtre texte, liste cliquable, appel `addClub(team.id, team.name, team.logo)`.

Structure (style repris du dialog existant, primitives `Dialog`/`DialogContent` shadcn) :

```tsx
"use client";

import { useState } from "react";
import { addClub } from "@/actions/teams";
import { FOOTBALL_DATA_COMPETITIONS } from "@/lib/constants";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";

interface ApiTeam { id: number; name: string; shortName: string; logo: string }
export interface ApiTeamAdded { subject: string; apiTeamId: number; logoUrl: string }

interface AddApiTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamAdded?: (team: ApiTeamAdded) => void;
}

export function AddApiTeamDialog({ open, onOpenChange, onTeamAdded }: AddApiTeamDialogProps) {
  const [competition, setCompetition] = useState<string | null>(null);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<number | null>(null);

  async function loadCompetition(code: string) {
    setCompetition(code); setError(null); setLoading(true); setTeams([]);
    try {
      const res = await fetch(`/api/football/search?competition=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error("fetch");
      setTeams(await res.json());
    } catch {
      setError("Impossible de charger les équipes de cette compétition.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(team: ApiTeam) {
    setAdding(team.id);
    const res = await addClub(team.id, team.name, team.logo);
    setAdding(null);
    if (res && "error" in res) { setError(res.error as string); return; }
    onTeamAdded?.({ subject: team.name, apiTeamId: team.id, logoUrl: team.logo });
    onOpenChange(false);
  }

  const filtered = search
    ? teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : teams;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Ajouter une équipe</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choisis une compétition puis l'équipe (football-data.org).
          </DialogDescription>
        </DialogHeader>

        {/* Compétitions */}
        <div className="grid grid-cols-2 gap-2">
          {FOOTBALL_DATA_COMPETITIONS.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => loadCompetition(c.code)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                competition === c.code
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-card border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              <span>{c.flag}</span> {c.name}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Recherche + liste */}
        {competition && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrer une équipe..."
                className="w-full h-10 rounded-lg bg-card border border-border pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border/50">
              {loading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">Aucune équipe</div>
              ) : (
                filtered.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={adding !== null}
                    onClick={() => handleAdd(t)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 disabled:opacity-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.logo} alt="" className="h-6 w-6 object-contain flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">{t.name}</span>
                    {adding === t.id && <Loader2 className="h-4 w-4 animate-spin ml-auto" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

> Note : si `followed-teams.tsx` utilise `<TeamLogo>` plutôt qu'`<img>`, réutiliser le même composant pour cohérence. Vérifier le contrat exact d'`addClub` (retour `{ success } | { error }`) déjà lu dans `teams.ts`.

- [ ] **Step 2 : Refactorer `followed-teams.tsx`**

Dans `src/components/profile/followed-teams.tsx` : supprimer le state/handlers/JSX du dialog « Add club » désormais dans `AddApiTeamDialog`, importer et monter `<AddApiTeamDialog open={addClubOpen} onOpenChange={setAddClubOpen} onTeamAdded={() => { /* refresh liste locale existante */ }} />`. Conserver le state `addClubOpen` (déclencheur du bouton +) et la logique de refresh des mappings déjà présente. Ne pas toucher au flux « link subject → club » (subject_links), hors scope.

- [ ] **Step 3 : Vérifier build + lint**

Run : `npm run lint && npm run build`
Expected : PASS.

- [ ] **Step 4 : Test manuel rapide (profil)**

Run : `npm run dev` puis, sur `/profile`, ouvrir « ajouter une équipe » → choisir une compétition → ajouter une équipe.
Expected : l'équipe est ajoutée (comme avant le refactor), aucune régression.

- [ ] **Step 5 : Commit**

```bash
git add src/components/teams/add-api-team-dialog.tsx src/components/profile/followed-teams.tsx
git commit -m "refactor(teams): extraction AddApiTeamDialog reutilisable"
```

---

## Task 5 : Composant `BetForm`

**Files:**
- Create: `src/components/paris/bet-form.tsx`
- Create (si `bet-form` > 200 l.): `src/components/paris/team-search.tsx`

**Interfaces:**
- Consumes : `createBetEntry` (Task 3), `AddApiTeamDialog` + `ApiTeamAdded` (Task 4), `bet-calc` (Task 2), `BET_TYPES`/`SPORTS` (`@/lib/constants`).
- Produces :
  ```ts
  interface ExistingSubject {
    subject: string; betType: string; sport: string; lastStatus: string; logoUrl?: string;
    activeSeries?: { id: string; targetGain: number; betCount: number; sumStakes: number };
  }
  interface TeamMappingLite { subject: string; apiTeamId: number | null; logoUrl: string | null; sport: string }
  interface LockedSeries { seriesId: string; subject: string; betType: string; sport: string; targetGain: number; betCount: number; sumStakes: number }
  interface BetFormProps {
    existingSubjects: ExistingSubject[];
    teamMappings: TeamMappingLite[];
    lockedSeries?: LockedSeries;   // mode reprise verrouillé (page détail série)
    onSuccess?: () => void;
  }
  export function BetForm(props: BetFormProps): JSX.Element
  ```

- [ ] **Step 1 : État & logique**

Créer `src/components/paris/bet-form.tsx` (`"use client"`). Modèle de style = `SeriesForm`. État :

```ts
const [sport, setSport] = useState<string>(lockedSeries?.sport ?? "football");
const [name, setName] = useState<string>(lockedSeries?.subject ?? "");
const [selected, setSelected] = useState<ExistingSubject | null>(null); // subject résolu
const [apiTeam, setApiTeam] = useState<ApiTeamAdded | null>(null);      // équipe API choisie
const [mode, setMode] = useState<"resume" | "serie" | "unique">(lockedSeries ? "resume" : "serie");
const [betType, setBetType] = useState<string>(lockedSeries?.betType ?? "");
const [targetGain, setTargetGain] = useState<number>(1);
const [odds, setOdds] = useState<string>("");
const [stake, setStake] = useState<string>("");
const [objective, setObjective] = useState<string>("");
const [uniqueDriver, setUniqueDriver] = useState<"objective" | "stake">("objective");
const [addTeamOpen, setAddTeamOpen] = useState(false);
const [error, setError] = useState<string | null>(null);
const [isPending, startTransition] = useTransition();
```

Résolution du nom (mode non verrouillé) : quand `name` change ou qu'on clique un résultat, chercher une série `en_cours` correspondant à `(name, betType)` dans `existingSubjects` :
- si trouvée → `mode='resume'`, bandeau reprise.
- si un subject existe mais série fermée, ou nom inconnu → afficher le sélecteur `[Nouvelle série]/[Pari unique]` (`mode` = `serie` ou `unique`).

Auto-calcul **live** (pari unique) — recalculer à chaque frappe de `odds`/`objective`/`stake` :

```ts
const o = parseFloat(odds);
// unique
if (mode === "unique" && o > 1) {
  if (uniqueDriver === "objective" && objective !== "") {
    setStake(String(stakeFromObjective(parseFloat(objective), o)));
  } else if (uniqueDriver === "stake" && stake !== "") {
    setObjective(String(objectiveFromStake(parseFloat(stake), o)));
  }
}
```

(mettre ce calcul dans un `useEffect` sur `[odds, objective, stake, uniqueDriver, mode]`, en écrivant seulement le champ dérivé de `uniqueDriver`.)

Auto-calcul (reprise / nouvelle série) — mise proposée, éditable :

```ts
// resume : n = betCount+1, S = sumStakes, T = targetGain de la série active
// serie  : n = 1, S = 0, T = targetGain (slider)
const n = mode === "resume" ? (ctx.betCount + 1) : 1;
const S = mode === "resume" ? ctx.sumStakes : 0;
const T = mode === "resume" ? ctx.targetGain : targetGain;
const suggested = o > 1 ? computeStake(n, T, S, o) : 0;
// pré-remplir `stake` avec suggested tant que l'utilisateur n'a pas édité manuellement
const gain = o > 1 && stake !== "" ? computePotentialNet(parseFloat(stake), o, S) : 0;
```

`ctx` = `lockedSeries ?? selected.activeSeries`.

- [ ] **Step 2 : JSX (form body adaptatif)**

Rendu conditionnel (réutiliser les classes de `SeriesForm`) :
1. **Sport** — sélecteur segmenté depuis `SPORTS` (masqué si `lockedSeries`).
2. **Nom** — si `lockedSeries` : lecture seule (nom + logo). Sinon : input recherche + dropdown filtrant `existingSubjects` (par `subject`) + `teamMappings` (mappings dont le subject n'a pas déjà de série), avec logo + pastille statut. En bas du dropdown, si `sport==='football'` et aucun résultat exact : bouton **« Ajouter une équipe »** → `setAddTeamOpen(true)`. Après ajout (`onTeamAdded`), `setName(team.subject); setApiTeam(team); setSelected(null); setMode('serie')`.
3. **Bandeau reprise** si `mode==='resume'` : « Reprise · Pari #{n} · objectif {T}€ ».
4. **Sélecteur** `[Nouvelle série]/[Pari unique]` si pas de série en cours.
5. **Type de pari** — boutons `BET_TYPES` (+ champ libre pour « autre »), comme `SeriesForm` (masqué en reprise, hérité).
6. **Champs selon le mode** :
   - `serie` : slider objectif (0–10€, comme `SeriesForm`) + cote + mise (préremplie `suggested`, éditable).
   - `resume` : cote + mise (préremplie, éditable) + gain net affiché.
   - `unique` : toggle driver `[Objectif]/[Mise]` + cote (obligatoire) + le champ driver ; l'autre champ est affiché en lecture (calculé) ; gain affiché.
7. **Erreur** + bouton submit (« Ajouter le pari » / « Lancer la série »).

- [ ] **Step 3 : Submit → `createBetEntry`**

```ts
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  const o = parseFloat(odds);
  if (isNaN(o) || o <= 1) { setError("La cote doit être supérieure à 1."); return; }

  const subject = lockedSeries?.subject ?? (apiTeam?.subject ?? name.trim());
  const type = lockedSeries?.betType ?? betType;
  const sp = (lockedSeries?.sport ?? sport) as SportType;

  const payload = {
    subject, betType: type, sport: sp, odds: o, mode,
    ...(mode === "serie" ? { targetGain } : {}),
    ...(mode === "unique" ? { targetGain: uniqueDriver === "objective" ? parseFloat(objective) : undefined,
                              stake: uniqueDriver === "stake" ? parseFloat(stake) : undefined } : {}),
    ...(mode === "resume" && stake !== "" ? { stake: parseFloat(stake) } : {}),
    ...(apiTeam ? { apiTeam: { apiTeamId: apiTeam.apiTeamId, crestUrl: apiTeam.logoUrl } } : {}),
  };

  startTransition(async () => {
    const res = await createBetEntry(payload as Parameters<typeof createBetEntry>[0]);
    if (res && "error" in res) { setError(res.error); return; }
    onSuccess?.();
  });
}
```

> `SportType` importé depuis `@/lib/types`. Le mode `serie` envoie la mise éditée via `stake` **seulement si** l'utilisateur l'a modifiée (sinon on laisse l'action recalculer) — optionnel : envoyer `stake` en override si le champ diffère de `suggested`.

- [ ] **Step 4 : Vérifier build + lint**

Run : `npm run lint && npm run build`
Expected : PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/components/paris/bet-form.tsx src/components/paris/team-search.tsx 2>/dev/null; git add src/components/paris/
git commit -m "feat(paris): BetForm unifie (resume/serie/unique + ajout equipe API)"
```

---

## Task 6 : Câblage (page /series/new, ParisPage, détail série)

**Files:**
- Modify: `src/app/(app)/series/new/page.tsx`
- Modify: `src/components/paris/paris-page.tsx`
- Modify: `src/components/series/series-detail.tsx`

**Interfaces:**
- Consumes : `BetForm` + ses types (Task 5).
- Produces : la modale « + » de ParisPage et l'ajout en page détail passent par `BetForm`.

- [ ] **Step 1 : Fournir les données au form dans `series/new/page.tsx`**

Étendre la page pour construire `existingSubjects` (avec la série active) et `teamMappings`. À partir des `allSeries` déjà chargées, agréger par `(subject, bet_type)` : `lastStatus`, et si une série `en_cours` existe, calculer `activeSeries { id, targetGain, betCount, sumStakes }` (fetch des bets de la série active, ou réutiliser les `bets` déjà chargés en filtrant par `series_id`). Passer `teamMappings` = `mappings` (déjà chargés) mappés en `{ subject, apiTeamId: m.api_team_id, logoUrl: m.logo_url, sport: m.sport }`. Transmettre à `ParisPage` (nouvelles props `existingSubjects`, `teamMappings`) en plus/à la place de `existingTeams`.

```ts
// bets déjà chargés (page actuelle) : Bet[] avec series_id, stake, bet_number, result
const bySeries = new Map<string, { betCount: number; sumStakes: number }>();
for (const b of bets ?? []) {
  const agg = bySeries.get(b.series_id) ?? { betCount: 0, sumStakes: 0 };
  agg.betCount += 1; agg.sumStakes += b.stake;
  bySeries.set(b.series_id, agg);
}
// allSeries : id, subject, bet_type, status, target_gain, created_at (ajouter id + target_gain au select)
const existingSubjects = /* groupby subject+bet_type -> { subject, betType, sport, lastStatus, logoUrl: logoMap[subject],
   activeSeries: active ? { id, targetGain: active.target_gain, ...bySeries.get(active.id) } : undefined } */;
```

> Ajuster le `select` de `allSeries` pour inclure `id, target_gain, sport`.

- [ ] **Step 2 : Remplacer le contenu de la modale dans `paris-page.tsx`**

Dans `src/components/paris/paris-page.tsx` : remplacer l'import `SeriesForm` par `BetForm` ; dans la `<Dialog>` finale, remplacer `<SeriesForm existingTeams=... onSuccess=... />` par `<BetForm existingSubjects={existingSubjects} teamMappings={teamMappings} onSuccess={() => setModalOpen(false)} />`. Mettre à jour `ParisPageProps` (ajouter `existingSubjects`, `teamMappings`). Dans la liste des paris, ajouter un badge « Unique » quand `bet.series.kind === 'unique'` et afficher le sport (emoji `SPORT_EMOJIS`) — champ `kind`/`sport` désormais dispo via le join `series` (ajouter `kind, sport` au select de `series` dans `series/new/page.tsx`).

- [ ] **Step 3 : Remplacer `AddBetForm` par `BetForm` en page détail**

Dans `src/components/series/series-detail.tsx` (ligne ~126) : remplacer `<AddBetForm seriesId={series.id} />` par `<BetForm lockedSeries={{ seriesId: series.id, subject: series.subject, betType: series.bet_type, sport: series.sport, targetGain: series.target_gain, betCount: bets.length, sumStakes: bets.reduce((s,b)=>s+b.stake,0) }} existingSubjects={[]} teamMappings={[]} />`. Retirer l'import `AddBetForm`.

- [ ] **Step 4 : Vérifier build + lint**

Run : `npm run lint && npm run build`
Expected : PASS.

- [ ] **Step 5 : Test manuel (dev)**

Run : `npm run dev`. Sur `/series/new`, ouvrir « + » → créer une série, reprendre, créer un pari unique. Sur une page détail série en cours → ajouter un pari (reprise verrouillée).
Expected : chaque parcours crée bien le pari attendu.

- [ ] **Step 6 : Commit**

```bash
git add "src/app/(app)/series/new/page.tsx" src/components/paris/paris-page.tsx src/components/series/series-detail.tsx
git commit -m "feat(paris): cablage BetForm (ParisPage, page detail serie, data new)"
```

---

## Task 7 : Nettoyage (retrait ancien flux)

**Files:**
- Delete: `src/components/bets/add-bet-form.tsx`, `src/components/series/series-form.tsx`
- Modify: `src/actions/bets.ts` (retrait `addBet`), `src/actions/series.ts` (retrait `createSeries`)

**Interfaces:**
- Consumes : rien (tous les appelants ont migré en Task 6).

- [ ] **Step 1 : Vérifier l'absence d'appelants résiduels**

Run : `grep -rn "AddBetForm\|SeriesForm\|\baddBet\b\|createSeries" src/`
Expected : plus aucune référence hors des définitions à supprimer (`bets.ts` `addBet`, `series.ts` `createSeries`).

- [ ] **Step 2 : Supprimer les composants et fonctions orphelines**

```bash
git rm src/components/bets/add-bet-form.tsx src/components/series/series-form.tsx
```

Dans `src/actions/bets.ts` : supprimer la fonction `addBet` (lignes ~6-84). Dans `src/actions/series.ts` : supprimer `createSeries` (et l'import `BetType`/`VALID_BET_TYPES` s'ils ne servent plus après retrait). Conserver `abandonSeries`, `deleteSeries` (toujours utilisés).

- [ ] **Step 3 : Vérifier build + lint (aucun import mort)**

Run : `npm run lint && npm run build`
Expected : PASS, zéro warning d'import inutilisé.

- [ ] **Step 4 : Commit**

```bash
git add -A
git commit -m "chore(paris): retrait SeriesForm/AddBetForm + addBet/createSeries orphelins"
```

---

## Task 8 : Validation live + déploiement

**Files:** aucun (test manuel + merge).

- [ ] **Step 1 : Build final**

Run : `npm run lint && npm run build`
Expected : PASS.

- [ ] **Step 2 : Dérouler les 7 critères de validation (spec)**

Run : `npm run dev` et vérifier :
1. Nouvelle série foot sur équipe importée (logo) → mise auto, modifiable, pari #1.
2. Reprise série en cours (même nom+type) → pari #n, mise martingale correcte.
3. Pari unique : cote+objectif → mise correcte ; cote+mise → gain correct.
4. Non-foot (tennis) : nom libre, pas d'API, sport stocké, pari créé.
5. Foot introuvable API : fallback « créer sans lien API ».
6. Ajout équipe API inline (compétition → équipe) puis pari dessus.
7. Aucune régression liste/détail (ancien flux retiré).

- [ ] **Step 3 : Merge + deploy prod**

```bash
git checkout master && git merge --no-ff -  # si travail sur branche ; sinon déjà sur master
git push origin master   # auto-deploy Vercel prod
```

- [ ] **Step 4 : Test live post-deploy + mise à jour vault**

Vérifier les parcours sur l'URL prod. Puis mettre à jour `2 - PROJETS/bettracker/CLAUDE.md` : cocher « B — Refonte création de paris », loguer la décision de clôture, pointer « Reprendre par » vers le chantier **A**.

---

## Self-Review (rempli à l'écriture)

- **Couverture spec** : migration kind/sport (T1) ✓ ; calc auto objectif↔mise + martingale (T2) ✓ ; `createBetEntry` 3 modes + lien API + fallback (T3) ✓ ; recherche locale + ajout API inline (T4/T5) ✓ ; états du form (T5) ✓ ; câblage + badge unique/sport (T6) ✓ ; retrait ancien flux (T7) ✓ ; 7 critères live (T8) ✓.
- **Hors scope confirmé** : navbar/header (A), agrégation club (D), freebets (C) — non touchés.
- **Cohérence des types** : `createBetEntry`/`CreateBetInput` (T3) ↔ payload `BetForm` (T5) ↔ `bet-calc` (T2) alignés (`computeStake`, `computePotentialNet`, `stakeFromObjective`, `objectiveFromStake`, `round2`).
- **Risque connu** : `equipes-page.tsx` + `placeBet` gardent l'ancienne formule en parallèle jusqu'à D — cohérent (même `bet-calc` conceptuel), pas de double écriture.
