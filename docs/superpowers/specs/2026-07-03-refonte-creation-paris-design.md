# Chantier B — Refonte création de paris (form unifié)

> Spec design. Fait partie d'un découpage en 4 chantiers (B → A → D → C).
> Ordre : **B (ce doc)** → A (nav & header) → D (page Équipes agrégée) → C (freebets dans la création).
> Cadence : merge + deploy prod à la fin de chaque chantier (test live avant le suivant).

## Objectif

Remplacer les deux flux séparés actuels (créer une **série** via `SeriesForm`, puis
ajouter un **pari** via `AddBetForm` avec juste une cote) par **un seul form unifié**
qui, à partir d'un nom, détecte le contexte et propose : reprise de série en cours,
nouvelle série, ou pari unique — avec calcul mise/objectif automatique et modifiable.

## Décisions figées (validées avec Rémi)

- **Pari unique** = une série `kind='unique'` d'un seul pari → réutilise toute la
  mécanique série (stats, dashboard, listes, joins) sans refonte.
- **Type de pari conservé** partout (victoire / defaite / buteur / autre) — badge + stats.
- **Point d'entrée unique** : ce form remplace `SeriesForm` + `AddBetForm`. La page
  détail série réutilisera le form en mode « reprise » verrouillé sur la série.
- **Football → équipe API** : le nom doit résoudre à une équipe API (mapping existant),
  **sinon fallback manuel autorisé** (nom libre, sans logo ni calendrier).
- **Non-foot** (tennis / basket / rugby) → nom libre, pas d'API.
- **`subject` stocké = nom canonique API** quand lié (évite la fragmentation de
  l'agrégation par nom au chantier D).

## Recherche & ajout d'équipe API (validé 2026-07-03)

`football-data.org` ne cherche pas par nom libre — endpoint scopé par compétition
(`/competitions/{code}/teams`). Flux retenu **inline dans le form** :

- **Recherche = locale** : subjects de séries existants + `team_mappings` déjà ajoutés
  (avec logos). Filtre instantané, aucun appel réseau à la frappe.
- **Équipe absente du local → bouton « Ajouter équipe »** (dans le form) : choisir la
  **compétition** (`FOOTBALL_DATA_COMPETITIONS`) → lister ses équipes
  (`/api/football/search?competition=X`) → choisir l'équipe → `addClub()` (crée
  `team_mappings` + `subject_link`, idempotent) → l'équipe est **aussitôt sélectionnée**
  pour le pari.
- Ce picker compétition→équipe existe déjà dans `components/profile/followed-teams.tsx`
  → **l'extraire en composant réutilisable** `components/teams/add-api-team-dialog.tsx`,
  réutilisé par : le form de pari (B), le profil (refactor), et la page Équipes (D).
- **Fallback** : équipe foot introuvable même via l'API → « créer sans lien API »
  (nom libre, sans logo ni calendrier).

## Modèle de données

Migration `supabase/migrations/00019_add_series_kind_sport.sql` :

```sql
alter table series
  add column kind  text not null default 'serie'
    check (kind in ('serie','unique')),
  add column sport text not null default 'football'
    check (sport in ('football','tennis','rugby','basket'));
```

- Aucun autre changement de schéma. `bets`, `team_mappings`, `subject_links`,
  `equipes` inchangés.
- Regénérer `src/lib/types/database.ts`. `Series` / `SeriesInsert` héritent des colonnes.
- `SeriesStatus` / `SportType` déjà définis dans `lib/types`.

Note : un pari unique reste une série `en_cours` d'un pari. La validation gagné/perdu
existante s'applique (gagné → série `gagnee`). `target_gain` d'une série `unique` = son
objectif de gain net.

## Action serveur — `createBetEntry` (dans `src/actions/bets.ts`)

Orchestrateur unique. Remplace/absorbe `placeBet` (equipes.ts) et le chemin
`createSeries` (series.ts). Réutilise la formule martingale existante.

```ts
type BetMode = "resume" | "serie" | "unique";

interface CreateBetInput {
  subject: string;          // nom canonique (API si lié, sinon libre)
  betType: string;          // victoire | defaite | buteur | <texte libre>
  sport: SportType;         // "football" par défaut
  mode: BetMode;
  odds: number;             // obligatoire, > 1
  targetGain?: number;      // serie: requis ; unique: si saisi côté objectif
  stake?: number;           // resume/serie: override optionnel ; unique: si saisi côté mise
  // lien API (foot) : garanti idempotent si fourni
  apiTeam?: { apiTeamId: number; crestUrl: string; kind?: "club" | "national"; country?: string };
}
```

Branches :

- **`resume`** — trouver la série `en_cours` par `(user, subject, betType)`. Absente
  → erreur « aucune série en cours ». Calcul `n`, `Σ mises précédentes`, `T = target_gain`.
  `stake = override>0 ? override : (n·T + Σ)/(cote−1)`. Insert pari `#n`.
- **`serie`** — `targetGain > 0` requis. Créer série `kind='serie'`, `sport`, `status='en_cours'`.
  Upsert `equipes` (name, betType, sport). `n=1, Σ=0`. `stake = override>0 ? override : T/(cote−1)`.
  Insert pari `#1`.
- **`unique`** — exactement un de `{targetGain, stake}` fourni.
  - mise saisie → `targetGain = stake·(cote−1)`
  - objectif saisi → `stake = targetGain/(cote−1)`
  Créer série `kind='unique'`, `sport`, `target_gain = targetGain`, `status='en_cours'`.
  Upsert `equipes`. Insert le pari `#1`.

Commun : `potential_net = stake·cote − stake − Σ` (arrondi 2 déc.). Foot + `apiTeam`
fourni → upsert `team_mappings` + `subject_links` (logique `addClub`, idempotente).
Revalidate `/series`, `/series/{id}`, `/`.

`addBet(seriesId, odds)` (standalone, `bets.ts`) → **supprimé** (remplacé par
`resume`). `validateResult`, `deleteBet`, `updateBet` inchangés.

## Résolution du nom (client)

Données fournies par la page (server → client) :

- `existingSubjects`: pour chaque `(subject, betType)` :
  `{ subject, betType, sport, lastStatus, logoUrl, activeSeries?: { id, targetGain, betCount, sumStakes } }`.
- `teamMappings`: `{ subject, apiTeamId, logoUrl, sport, kind, country }` (clubs importés
  non encore pariés).

Recherche = filtre local sur `subject` (subjects + mappings), fusionné, dédupliqué,
trié : séries en cours d'abord, puis équipes importées, puis fermées. Logo affiché.

## États du form & champs

Un seul form adaptatif (modale) :

1. **Sport** — sélecteur segmenté (football défaut).
2. **Nom** — input recherche + dropdown (résultats locaux avec logo + pastille statut).
3. Après résolution :
   - **Série `en_cours` trouvée** pour `(subject, betType)` → bandeau
     « Reprise · Pari #n · objectif T€ ». Champs : **Cote** + **Mise** (auto, éditable)
     → gain net live. Mode `resume`.
   - **Équipe connue série fermée** OU **nom inconnu** → sélecteur
     **[Nouvelle série] / [Pari unique]** :
     - **Nouvelle série** (mode `serie`) : Type + Objectif (slider 0–10€) + Cote →
       Mise auto éditable.
     - **Pari unique** (mode `unique`) : Type + **Cote (obligatoire)** +
       (**Objectif** XOR **Mise**, l'autre calculé) → gain affiché.
4. **Football, nom absent du local** → bouton **« Ajouter équipe »** (dialog
   compétition → équipe → `addClub`), puis l'équipe ajoutée est sélectionnée pour le pari.
   Si vraiment introuvable via l'API → « créer sans lien API » (fallback nom libre).

## Formules (client, live)

- Pari unique (1 pari) : `objectif = mise·(cote−1)` ↔ `mise = objectif/(cote−1)` ;
  gain affiché = objectif.
- Reprise / nouvelle série : `mise = (n·T + Σ précédentes)/(cote−1)` par défaut,
  éditable → recalcul `gain = mise·cote − mise − Σ`.

## UI / composants

- **+** `src/components/paris/bet-form.tsx` — le form unifié (≤ 200 l.).
- **+** `src/components/paris/team-search.tsx` — champ nom + dropdown (si `bet-form` > 200 l.).
- **+** `src/components/teams/add-api-team-dialog.tsx` — picker compétition → équipe →
  `addClub`, **extrait** de `followed-teams.tsx` pour réutilisation (form pari, profil, Équipes).
- **~** `src/components/profile/followed-teams.tsx` — refactor pour consommer
  `add-api-team-dialog.tsx` (supprime le picker dupliqué).
- **~** `src/components/paris/paris-page.tsx` — modale « Nouvelle série » remplacée par
  `BetForm` ; badge « unique » + sport dans les cartes de la liste.
- **~** `src/app/(app)/series/new/page.tsx` — fournir `existingSubjects` (avec active
  series : id/target/betCount/sumStakes) + `teamMappings`.
- **~** `src/app/(app)/series/[id]/page.tsx` — remplacer `AddBetForm` par `BetForm` en
  mode `resume` verrouillé sur la série.
- **−** `src/components/series/series-form.tsx`, `src/components/bets/add-bet-form.tsx` — retirés.
- **~** `src/actions/bets.ts` (`createBetEntry`, suppression `addBet`),
  `src/actions/series.ts` (retrait chemin form `createSeries`),
  `src/actions/equipes.ts` (dépréciation `placeBet`).

## Hors scope B (renvoyé aux autres chantiers)

- Navbar, header, titre bicolore, switch Équipes/Paris → **A**.
- Card club agrégée par nom, ROI général, expand sous-lignes, ajout équipes API depuis
  la page Équipes → **D**.
- Toggle freebet + calcul freebet dans le form → **C**.

## Risques / points ouverts

- **Alias → canonique** : si Rémi tape « PSG » mais choisit l'API « Paris Saint-Germain FC »,
  on stocke le canonique. À confirmer (peut surprendre à l'affichage).
- **Migration destructive ?** Non : `kind`/`sport` ont des défauts, séries existantes OK.
- **`updateBet`** reste la voie d'édition post-création (déjà en place, cohérent).

## Critères de validation (test live après merge)

1. Créer une **nouvelle série** foot sur une équipe importée (logo) → mise auto,
   modifiable, pari #1 créé.
2. **Reprendre** une série en cours (même nom+type) → pari #n, mise martingale correcte.
3. Créer un **pari unique** : cote + objectif → mise correcte ; cote + mise → gain correct.
4. **Non-foot** (tennis) : nom libre, pas d'API, sport stocké, pari créé.
5. **Foot introuvable API** : fallback « sans lien API » fonctionne.
6. Ancien parcours (`SeriesForm`/`AddBetForm`) retiré, aucune régression liste/détail.
7. `npm run build` OK.
