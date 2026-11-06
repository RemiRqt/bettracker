# Coupe du Monde — équipes nationales & lien N:N — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lier des paris (séries) aux équipes nationales et afficher les matchs de la Coupe du Monde 2026 dans le calendrier — comme pour les clubs — via une relation N:N subject↔entité API.

**Architecture:** Un seul provider (football-data.org, qui couvre `WC` en gratuit). Une nationale = une ligne `team_mappings` (`is_club=true`, `kind='national'`, `country`) ajoutée via le flux clubs existant → le calendrier la prend automatiquement. Le lien subject↔entité passe de 1:1 (champ `api_team_id` sur la ligne subject) à N:N via la table `subject_links`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Supabase (Postgres + RLS), Tailwind v4, football-data.org v4.

## Global Constraints

- **Provider unique** : football-data.org v4, base `https://api.football-data.org/v4`, header `X-Auth-Token: process.env.FOOTBALL_DATA_API_KEY`. World Cup : code `WC`, compétition id `2000`. **Aucun code api-sports.**
- **Schéma déjà appliqué en DB** (`team_mappings.provider/kind/country` + table `subject_links(id, user_id, subject, team_mapping_id, created_at, unique(user_id,subject,team_mapping_id))`). Les migrations versionnées créées ici doivent être **idempotentes** (`if not exists`, `drop policy if exists … create`) pour ne pas casser un `supabase db push`.
- **Toutes les requêtes DB via server actions** (`src/actions/`), jamais dans les composants. RLS `auth.uid() = user_id`.
- **Types `database.ts` maintenus à la main** : toute table/colonne nouvelle y est ajoutée.
- **Pas de test runner** : portes de vérif = `npm run build` (doit passer) + contrôle visuel. NE PAS lancer `npm run lint` (cassé repo-wide, Next 16). Pour le SQL non testable sans DB : relecture + `supabase db push --dry-run` si dispo, sinon revue manuelle.
- **Git** : un commit par tâche, stage UNIQUEMENT les fichiers de la tâche (jamais `git add -A` — il y a des fichiers non liés non commités dans le repo). Travailler sur `master`, ne PAS pousser sans demande.
- **api-sports** : retirer `APISPORTS_KEY` de `.env.local` (clé inutilisée).

---

### Task 1: Migrations versionnées (idempotentes) + types

**Files:**
- Create: `supabase/migrations/00015_extend_team_mappings_national.sql`
- Create: `supabase/migrations/00016_create_subject_links.sql`
- Modify: `src/lib/types/database.ts`

**Interfaces:**
- Produces: colonnes `team_mappings.provider/kind/country` (déjà en DB, versionnées ici) ; table `subject_links` ; types TS `team_mappings` (+3 colonnes) et `subject_links` (Row/Insert/Update).

- [ ] **Step 1: `00015_extend_team_mappings_national.sql`**

```sql
-- Colonnes déjà appliquées en prod via dashboard ; versionnées en idempotent.
alter table team_mappings add column if not exists provider text not null default 'football-data';
alter table team_mappings add column if not exists kind text not null default 'club';
alter table team_mappings add column if not exists country text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'team_mappings_provider_check') then
    alter table team_mappings add constraint team_mappings_provider_check
      check (provider in ('football-data','api-sports'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'team_mappings_kind_check') then
    alter table team_mappings add constraint team_mappings_kind_check
      check (kind in ('club','national'));
  end if;
end $$;
```

- [ ] **Step 2: `00016_create_subject_links.sql`**

```sql
create table if not exists subject_links (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  subject         text not null,
  team_mapping_id uuid not null references team_mappings(id) on delete cascade,
  created_at      timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subject_links_unique') then
    alter table subject_links add constraint subject_links_unique
      unique (user_id, subject, team_mapping_id);
  end if;
end $$;

create index if not exists idx_subject_links_user_subject on subject_links(user_id, subject);

alter table subject_links enable row level security;

drop policy if exists "subject_links_select" on subject_links;
create policy "subject_links_select" on subject_links for select using (auth.uid() = user_id);
drop policy if exists "subject_links_insert" on subject_links;
create policy "subject_links_insert" on subject_links for insert with check (auth.uid() = user_id);
drop policy if exists "subject_links_delete" on subject_links;
create policy "subject_links_delete" on subject_links for delete using (auth.uid() = user_id);
```

- [ ] **Step 3: Types — `src/lib/types/database.ts`**

Lire d'abord le fichier pour le format exact. Sur l'entrée `team_mappings`, ajouter aux `Row` (et `Insert`/`Update` en optionnel) : `provider: string`, `kind: string`, `country: string | null`. Ajouter une nouvelle entrée `subject_links` en suivant le format des autres tables :

```ts
subject_links: {
  Row: { id: string; user_id: string; subject: string; team_mapping_id: string; created_at: string };
  Insert: { id?: string; user_id: string; subject: string; team_mapping_id: string; created_at?: string };
  Update: { id?: string; user_id?: string; subject?: string; team_mapping_id?: string; created_at?: string };
  Relationships: [];
};
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: compile OK.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/00015_extend_team_mappings_national.sql supabase/migrations/00016_create_subject_links.sql src/lib/types/database.ts
git commit -m "feat(cdm): migrations team_mappings national + subject_links + types"
```

---

### Task 2: Coupe du Monde dans le picker + `addClub(kind, country)`

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/actions/teams.ts`
- Modify: `src/components/profile/followed-teams.tsx`

**Interfaces:**
- Consumes: types de Task 1.
- Produces: `addClub(apiTeamId, name, crestUrl, options?: { kind?: "club" | "national"; country?: string })` ; `TeamMapping` interface étendue avec `provider/kind/country`.

- [ ] **Step 1: `constants.ts` — ajouter WC**

Dans `FOOTBALL_DATA_COMPETITIONS`, ajouter en dernière entrée :
```ts
  { code: "WC", name: "Coupe du Monde", flag: "🏆" },
```

- [ ] **Step 2: `teams.ts` — `TeamMapping` + tous les `.select`**

Ajouter à l'interface `TeamMapping` (après `is_club`):
```ts
  kind: string;
  country: string | null;
  provider: string;
```
Et ajouter `kind, country, provider` à CHAQUE chaîne `.select("id, subject, api_team_id, logo_url, sport, is_club, is_followed, next_matches_count, cached_fixtures, fixtures_updated_at")` du fichier (il y en a plusieurs : `getTeamMappings`, `getFollowedTeams`, `ensureTeamMappings` ×2, `getCalendarTeams`). Nouvelle valeur :
```
"id, subject, api_team_id, logo_url, sport, is_club, kind, country, provider, is_followed, next_matches_count, cached_fixtures, fixtures_updated_at"
```

- [ ] **Step 3: `teams.ts` — `addClub` étendu**

Remplacer la signature et l'insert de `addClub` :
```ts
export async function addClub(
  apiTeamId: number,
  name: string,
  crestUrl: string,
  options?: { kind?: "club" | "national"; country?: string }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");

  const { data: existing } = await supabase
    .from("team_mappings")
    .select("id")
    .eq("user_id", user.id)
    .eq("api_team_id", apiTeamId)
    .eq("is_club", true)
    .maybeSingle();
  if (existing) return { error: "Cette equipe est deja ajoutee." };

  const { error } = await supabase.from("team_mappings").insert({
    user_id: user.id,
    subject: name,
    api_team_id: apiTeamId,
    logo_url: crestUrl,
    sport: "football",
    is_club: true,
    is_followed: false,
    kind: options?.kind ?? "club",
    country: options?.country ?? null,
    provider: "football-data",
  });
  if (error) return { error: `Erreur: ${error.message}` };

  revalidateTeamPaths();
  return { success: true };
}
```

- [ ] **Step 4: `followed-teams.tsx` — marquer les ajouts WC comme nationaux**

Lire le fichier. La compétition « Coupe du Monde » apparaît automatiquement dans le picker (constants). Là où le composant appelle `addClub(team.id, team.name, team.crest)` après sélection d'une équipe, passer le 4e argument quand la compétition sélectionnée a `code === "WC"` :
```ts
const isWC = selectedCompetition?.code === "WC";
await addClub(team.id, team.name, team.crest,
  isWC ? { kind: "national", country: team.name } : undefined);
```
(adapter aux noms de variables réels du composant — `selectedCompetition`/`team` peuvent différer ; le point est : si code WC → `{ kind: "national", country: <nom de la sélection> }`).

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 6: Commit**

```bash
git add src/lib/constants.ts src/actions/teams.ts src/components/profile/followed-teams.tsx
git commit -m "feat(cdm): Coupe du Monde dans le picker + addClub(kind, country)"
```

---

### Task 3: Server actions `subject_links` (N:N)

**Files:**
- Modify: `src/actions/teams.ts` (ajouter en fin de fichier)

**Interfaces:**
- Produces:
  - `interface SubjectLink { id: string; subject: string; team_mapping_id: string; created_at: string }`
  - `getSubjectLinks(): Promise<SubjectLink[]>`
  - `linkSubject(subject: string, teamMappingId: string): Promise<{ success: true } | { error: string }>`
  - `unlinkSubject(subject: string, teamMappingId: string): Promise<{ success: true } | { error: string }>`

- [ ] **Step 1: Ajouter les actions dans `teams.ts`**

```ts
export interface SubjectLink {
  id: string;
  subject: string;
  team_mapping_id: string;
  created_at: string;
}

export async function getSubjectLinks(): Promise<SubjectLink[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");

  const { data, error } = await supabase
    .from("subject_links")
    .select("id, subject, team_mapping_id, created_at")
    .eq("user_id", user.id);
  if (error) throw new Error(`Erreur liens: ${error.message}`);
  return (data as SubjectLink[]) || [];
}

export async function linkSubject(subject: string, teamMappingId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");
  if (!subject?.trim()) return { error: "Le sujet est requis." };

  const { error } = await supabase
    .from("subject_links")
    .upsert(
      { user_id: user.id, subject: subject.trim(), team_mapping_id: teamMappingId },
      { onConflict: "user_id,subject,team_mapping_id" }
    );
  if (error) return { error: `Erreur lors du lien: ${error.message}` };

  revalidateTeamPaths();
  return { success: true };
}

export async function unlinkSubject(subject: string, teamMappingId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Vous devez etre connecte.");

  const { error } = await supabase
    .from("subject_links")
    .delete()
    .eq("user_id", user.id)
    .eq("subject", subject)
    .eq("team_mapping_id", teamMappingId);
  if (error) return { error: `Erreur lors du retrait: ${error.message}` };

  revalidateTeamPaths();
  return { success: true };
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add src/actions/teams.ts
git commit -m "feat(cdm): server actions subject_links (link/unlink/get N:N)"
```

---

### Task 4: Migration des liens existants → `subject_links`

**Files:**
- Create: `supabase/migrations/00017_backfill_subject_links.sql`

**Interfaces:**
- Consumes: tables de Task 1.

- [ ] **Step 1: `00017_backfill_subject_links.sql`**

Convertit les anciens liens 1:1 (lignes `is_club=false` portant un `api_team_id`) en lignes `subject_links` pointant vers la ligne club (`is_club=true`) de même `api_team_id`. Idempotent (`on conflict do nothing`). NE supprime ni ne vide les anciennes lignes (legacy inerte, rollback possible).

```sql
insert into subject_links (user_id, subject, team_mapping_id)
select tf.user_id, tf.subject, tc.id
from team_mappings tf
join team_mappings tc
  on  tc.user_id   = tf.user_id
  and tc.api_team_id = tf.api_team_id
  and tc.is_club   = true
where tf.is_club = false
  and tf.api_team_id is not null
on conflict (user_id, subject, team_mapping_id) do nothing;
```

- [ ] **Step 2: Revue SQL**

Relire le SQL : jointure sur `(user_id, api_team_id)`, filtre `is_club=false & api_team_id not null`, `on conflict do nothing`. Pas de DELETE/UPDATE. Confirmer l'idempotence.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00017_backfill_subject_links.sql
git commit -m "feat(cdm): backfill des liens existants vers subject_links"
```

---

### Task 5: Brancher le code lecteur sur `subject_links` (Équipes + calendrier)

**Files:**
- Modify: `src/app/(app)/series/page.tsx` et/ou `src/components/equipes/equipes-page.tsx` (construction `logoMap` / `nextFixtureMap`)
- Modify: `src/components/calendar/calendar-page.tsx` (badge « série active »)
- (le serveur fournit les données via `getSubjectLinks()` + `getTeamMappings()` de Task 2/3)

**Interfaces:**
- Consumes: `getSubjectLinks()`, `TeamMapping` (avec `kind/country`), `getCalendarFixtures()`.

- [ ] **Step 1: Résoudre subject → entités via `subject_links`**

Lire les fichiers. Aujourd'hui le lien subject→logo/fixtures se fait par text-matching `subject === team_mappings.subject (is_club=false)` puis `api_team_id`. Le remplacer par : pour un `subject`, récupérer ses `subject_links` → `team_mapping_id[]` → les `team_mappings` correspondants (clubs et/ou nationales) → leurs `logo_url` / `cached_fixtures`.

Construire un index réutilisable côté page serveur :
```ts
// links: SubjectLink[] (getSubjectLinks), mappings: TeamMapping[] (getTeamMappings)
const byId = new Map(mappings.map((m) => [m.id, m]));
const entitiesBySubject = new Map<string, TeamMapping[]>();
for (const l of links) {
  const ent = byId.get(l.team_mapping_id);
  if (!ent) continue;
  const arr = entitiesBySubject.get(l.subject) ?? [];
  arr.push(ent);
  entitiesBySubject.set(l.subject, arr);
}
```
- `logoMap[subject]` = `entitiesBySubject.get(subject)?.[0]?.logo_url` (1er logo lié).
- `nextFixtureMap[subject]` = la date du prochain fixture parmi les `cached_fixtures` de TOUTES les entités liées au subject (min des dates futures).

- [ ] **Step 2: Badge « série active » du calendrier via `subject_links`**

Lire `calendar-page.tsx`. Aujourd'hui un fixture est marqué « série active » si un subject à série `en_cours` matche (via team_mappings.subject → api_team_id) le club du fixture. Le remplacer par : un fixture (qui appartient à une entité `team_mapping_id`) est « série active » si **un subject ayant une série `en_cours` est lié à cette entité** dans `subject_links`. Construire `activeEntityIds = Set<team_mapping_id>` à partir des subjects en `en_cours` → leurs liens → `team_mapping_id`, puis marquer un fixture actif si son entité d'origine est dans le set.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 4: Vérif visuelle**

`npm run dev` → page Équipes : logos toujours affichés ; calendrier : badge « série active » correct sur les matchs des entités liées à une série en cours.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/series/page.tsx" src/components/equipes/equipes-page.tsx src/components/calendar/calendar-page.tsx
git commit -m "refactor(cdm): résolution subject->entités via subject_links (équipes + calendrier)"
```

---

### Task 6: UI de liaison multi-link

**Files:**
- Modify: `src/components/profile/followed-teams.tsx`

**Interfaces:**
- Consumes: `linkSubject`, `unlinkSubject`, `getSubjectLinks` (Task 3) ; `getTeamMappings` (clubs + nationales).

- [ ] **Step 1: Remplacer le lien 1:1 par le multi-link**

Lire le fichier. Aujourd'hui « Lier un joueur/equipe » appelle `linkTeamToApi(subject, api_team_id, logo)` (1:1). Le remplacer par une UI où, pour un `subject` donné, on voit la **liste de ses entités liées** (via `getSubjectLinks` + `getTeamMappings`) et on peut **ajouter/retirer** des entités (clubs ET nationales) :
- ajout → `linkSubject(subject, teamMapping.id)`
- retrait → `unlinkSubject(subject, teamMapping.id)`
Le sélecteur d'entités liste les `team_mappings` de l'utilisateur (clubs + nationales, distingués par `kind` : 🏆/drapeau pour `national`, logo club sinon). Garder le wording « Lier un joueur/équipe ».

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: OK.

- [ ] **Step 3: Vérif visuelle**

`npm run dev` → sur un subject (ex. « Mbappé »), lier le club PSG **et** la nationale France ; vérifier que les deux apparaissent et que le calendrier montre les matchs des deux après suivi.

- [ ] **Step 4: Commit**

```bash
git add src/components/profile/followed-teams.tsx
git commit -m "feat(cdm): UI multi-link subject -> clubs + nationales"
```

---

### Task 7: Nettoyage + vérification finale

**Files:**
- Modify: `.env.local` (retrait clé inutilisée — fichier gitignored, pas de commit)
- Modify: `src/actions/teams.ts` (déprécier `linkTeamToApi`/`unlinkTeamFromApi` si plus appelés)

- [ ] **Step 1: Retirer la clé api-sports inutile**

```bash
cd /Users/remi/projects/bettracker
sed -i '' '/^APISPORTS_KEY=/d' .env.local
grep -c APISPORTS_KEY .env.local || echo "clé retirée"
```

- [ ] **Step 2: Vérifier les usages restants de `linkTeamToApi`/`unlinkTeamFromApi`**

Run: `grep -rn "linkTeamToApi\|unlinkTeamFromApi" src`
Si plus aucun appel (hors leur définition) → les retirer de `teams.ts`. S'il reste des appels non migrés, les migrer vers `linkSubject`/`unlinkSubject` (Task 6 aurait dû tous les couvrir — sinon le signaler).

- [ ] **Step 3: Build final**

Run: `npm run build`
Expected: OK.

- [ ] **Step 4: Vérif manuelle bout-en-bout**

`npm run dev` :
1. Profil → picker « Coupe du Monde » → ajouter France + Brésil → suivre.
2. Calendrier → les matchs CdM de France/Brésil apparaissent (fusionnés avec les clubs).
3. Créer une série « France / victoire » ; lier le subject « France » à la nationale France → badge « série active » sur ses matchs.
4. Lier un subject joueur (ex. « Mbappé ») au club PSG + à la France → matchs des deux visibles.

- [ ] **Step 5: Commit**

```bash
git add src/actions/teams.ts
git commit -m "chore(cdm): nettoyage api-sports + dépréciation lien 1:1"
```

---

## Self-Review

- **Couverture spec :** provider football-data/WC (T2) ✓ · schéma versionné idempotent (T1,T4) ✓ · types (T1) ✓ · N:N subject_links + actions (T1,T3) ✓ · nationales via flux clubs (T2) ✓ · calendrier fusionné automatique (réutilisation `getCalendarTeams`/`getCalendarFixtures` — vérifié : nationales `is_club=true` passent déjà le filtre ; pas de changement requis) ✓ · code lecteur via subject_links (T5) ✓ · UI multi-link (T6) ✓ · cleanup api-sports (T7) ✓.
- **Placeholders :** code complet fourni pour les parties nouvelles (SQL, actions, addClub) ; les tâches sur fichiers existants (UI, lecteurs) donnent la logique exacte + le code de résolution, le subagent lit le fichier pour l'intégrer.
- **Cohérence des types :** `addClub(…, options?: {kind, country})`, `SubjectLink`, `linkSubject/unlinkSubject(subject, teamMappingId)`, `getSubjectLinks()` définis en T2/T3 et réutilisés en T5/T6 à l'identique. `TeamMapping` étendu (`kind/country/provider`) en T2, consommé en T5/T6.
- **Risque connu :** `getCalendarTeams` filtre sur `is_club=true` — les nationales DOIVENT être insérées avec `is_club=true` (c'est le cas dans `addClub`, T2). Si une nationale était insérée `is_club=false`, elle n'apparaîtrait pas au calendrier. Vérifié dans le code de T2.
- **Ordre/dépendances :** T1→T2→T3 (fondations) ; T4 (backfill) après T1 ; T5/T6 (lecteurs/UI) après T3 ; T7 (cleanup) en dernier.
