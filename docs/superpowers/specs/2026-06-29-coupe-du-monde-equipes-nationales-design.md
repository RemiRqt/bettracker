# Coupe du Monde — équipes nationales & lien N:N pari↔équipe — Design

**Date :** 2026-06-29
**Statut :** validé (Rémi), prêt pour le plan d'implémentation.

## Objectif

Permettre de lier des paris (séries) aux **équipes nationales** et d'afficher les **matchs de la Coupe du Monde 2026** dans le calendrier, exactement comme c'est déjà le cas pour les clubs européens. Un *subject* (l'équipe ou le joueur sur lequel on parie) peut être rattaché à **plusieurs** entités API (relation **N:N**) — typiquement un joueur lié à son club **et** à sa sélection.

## Décisions clés (actées)

1. **Un seul provider : football-data.org** (déjà intégré). Vérifié en live : `/competitions/WC` → FIFA World Cup id `2000`, saison 2026 (11/06 → 19/07), **en cours** ; `/competitions/WC/teams` → 48 sélections. La clé `FOOTBALL_DATA_API_KEY` existante couvre la CdM en plan gratuit. **api-sports.io est abandonné** (compte suspendu, et inutile).
2. **Relation N:N** entre subjects (texte) et entités API (clubs + nationales), via la table `subject_links`. Remplace l'ancien lien 1:1 par text-matching.
3. **Schéma DB déjà appliqué** (par Rémi, via le dashboard Supabase) — à **versionner** dans le repo en idempotent.
4. **Hors-scope** : api-sports ; les joueurs comme entité API normalisée (un joueur reste un *subject* texte) ; toute refonte du flux clubs existant.

## État du schéma (vérifié en DB le 2026-06-29)

Déjà appliqué en base, **non versionné** dans `supabase/migrations/` :

- `team_mappings` (table existante des entités API) + colonnes :
  - `provider text` (valeurs `football-data` | `api-sports` ; on n'utilisera que `football-data`)
  - `kind text` (`club` | `national`)
  - `country text` (nom du pays, pour les nationales)
- `subject_links` (nouvelle table N:N) : `id`, `user_id → auth.users`, `subject text`, `team_mapping_id → team_mappings(id)`, `created_at`, `unique(user_id, subject, team_mapping_id)`, RLS `auth.uid() = user_id`.

> ⚠️ Migration appliquée directement en prod (projet perso, une seule DB). Les fichiers de migration à créer doivent être **idempotents** (`add column if not exists`, `create table if not exists`) pour ne pas casser un `supabase db push` futur.

## Architecture

Le système réutilise au maximum le flux **clubs** existant (football-data.org), en y ajoutant la dimension « nationale » et le lien N:N.

### Composants

1. **Catalogue de compétitions** — `src/lib/constants.ts` : `FOOTBALL_DATA_COMPETITIONS` passe de 9 à 10 entrées en ajoutant `WC` (FIFA World Cup). Sert au picker du profil.
2. **Entités API (team_mappings)** — une nationale = une ligne `team_mappings` avec `kind='national'`, `country`, `api_team_id` (id football-data de la sélection), `logo_url` (drapeau/emblème), ajoutée via le **flux `addClub` existant** (étendu pour porter `kind`/`country`).
3. **Liens N:N (subject_links)** — un subject est rattaché à 0..N entités. Nouvelles server actions `linkSubject` / `unlinkSubject` / `getSubjectLinks` ; l'ancien `linkTeamToApi` (1:1) est remplacé/réécrit pour insérer dans `subject_links`. Migration des liens existants (`team_mappings.is_club=false`) vers `subject_links`.
4. **Calendrier fusionné** — `getCalendarTeams` inclut désormais les nationales suivies (`kind='national' & is_followed`) ; `getCalendarFixtures` récupère leurs matchs via `/teams/{id}/matches?competitions=WC` (même cache `cached_fixtures` 12h, même shape `CachedFixture`). Le badge « série active » résout `subject → entités` via `subject_links` au lieu du text-matching.
5. **UI** — `followed-teams.tsx` (profil) : « Coupe du Monde » dans le picker ; ajout/suivi des sélections ; liaison d'un subject à plusieurs entités (clubs + nationales).
6. **Types** — `src/lib/types/database.ts` : ajouter `subject_links` (Row/Insert/Update) et les colonnes `provider/kind/country` sur `team_mappings`.

### Flux de données

- **Ajouter une nationale** : picker WC → `/competitions/WC/teams` (cache 24h, déjà en place pour les clubs) → `addClub(..., kind:'national', country)` → ligne `team_mappings` → `toggleFollow`.
- **Lier un subject** : UI de liaison → `linkSubject(subject, team_mapping_id)` → `subject_links`.
- **Calendrier** : `getCalendarTeams` (clubs + nationales suivis) → `getCalendarFixtures` (cache football-data par entité, fetch `/teams/{id}/matches`) → fusion + tri par date → badge via `subject_links`.

### Gestion d'erreurs

- Quota football-data (10 req/min) : conserver le cache `cached_fixtures` (12h) ; en cas d'échec d'appel, servir le dernier cache connu (comportement existant).
- Une nationale sans match programmé (poule terminée, etc.) : liste vide, pas d'erreur.

## Contraintes (Global Constraints pour le plan)

- **Provider unique** football-data.org v4, base `https://api.football-data.org/v4`, header `X-Auth-Token: FOOTBALL_DATA_API_KEY`. Code WC = `WC`, id compétition `2000`.
- **Migrations idempotentes** reflétant le SQL déjà appliqué ; ne pas re-créer ni casser la DB existante.
- **Toutes les requêtes DB via server actions** (`src/actions/`), jamais dans les composants (règle projet). RLS `auth.uid() = user_id`.
- **Types `database.ts` maintenus à la main** (pas de génération auto) : toute nouvelle table/colonne y est ajoutée.
- **Pas de test runner** : vérif = `npm run build` + contrôle visuel (`npm run lint` est cassé repo-wide, Next 16).
- **api-sports** : retirer `APISPORTS_KEY` de `.env.local` (clé inutilisée). Aucun code api-sports.
- **Déploiement** : commit + push direct `master` (projet perso) → auto-deploy Vercel ; ne pas pousser sans demande explicite.

## Hors-scope (YAGNI)

- Aucune normalisation `players/teams/leagues` ; aucun changement du flux clubs football-data qui fonctionne.
- Pas de génération automatique de séries depuis les fixtures ; pas de pronostics/scores.
