# Suggestion automatique du résultat des paris — Design

**Date** : 2026-10-08
**Statut** : validé en brainstorming, à planifier

## Objectif

Ne plus devoir penser à valider Gagné/Perdu. Deux heures après le coup d'envoi d'un match de foot, l'app récupère le score final (football-data.org), **propose** un résultat et envoie une notif push. L'utilisateur confirme en un tap. Rien n'est écrit dans `bets.result` sans action de sa part.

## Décisions

| Sujet | Décision |
|---|---|
| Comportement | **Proposer + 1 tap** (pas d'écriture auto du résultat) |
| Rattachement pari ↔ match | **Stocké à la création** (`bets.fixture_id`), match le plus proche pré-sélectionné ; déduction en secours pour les paris existants |
| Déclencheur | **Coup d'envoi + 2h**, via `pg_cron` + `pg_net` Supabase toutes les 15 min → route Next (approche A) |
| Périmètre | Foot uniquement ; types `victoire` / `defaite` résolus ; `buteur` / `autre` = notif « match terminé » sans suggestion |

Approches écartées pour le déclencheur : Vercel Pro (20 $/mois pour un cron), Edge Function Supabase (duplication football-data + web-push en Deno).

## Modèle de données

### Migration `00020_bets_fixture_resolution.sql`

Colonnes ajoutées à `bets` :

| Colonne | Type | Rôle |
|---|---|---|
| `fixture_id` | `integer null` | ID match football-data |
| `fixture_kickoff` | `timestamptz null` | Coup d'envoi (filtrage sans appel API) |
| `suggested_result` | `text null check (suggested_result in ('gagne','perdu'))` | Résultat proposé, en attente de confirmation |
| `fixture_score` | `text null` | Score affiché, ex. `2-1` (domicile-extérieur) |
| `resolution_status` | `text null check (resolution_status in ('pending','suggested','postponed','expired','manual'))` | État de la résolution |

Index partiel : `create index idx_bets_pending_fixture on bets(fixture_kickoff) where result is null and fixture_id is not null;`

`resolution_status` à la création : `'pending'` si un match est choisi, `'manual'` si « Aucun match » est choisi explicitement (jamais traité par le cron). `null` = pari antérieur à la feature → candidat à la déduction en secours.

### Migration `00021_cron_resolve_bets.sql`

- `create extension if not exists pg_cron; create extension if not exists pg_net;`
- Secret `resolve_bets_cron_secret` stocké dans **Supabase Vault** (créé à la main, hors migration — valeur = `CRON_SECRET` Vercel).
- `cron.schedule('resolve-bets', '*/15 * * * *', $$ select net.http_get(url := 'https://<domaine-prod>/api/cron/resolve-bets', headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'resolve_bets_cron_secret'))) $$);`
- Le domaine de prod est renseigné au moment de l'implémentation (vérifié via Vercel).

## Règles de résolution

Fonction pure `resolveBet({ betType, teamId, match })` dans `src/lib/bet-resolution.ts`.

Entrée `match` : `{ status, homeTeamId, awayTeamId, fullTime: { home, away } }` (champs football-data v4).

| Statut match | Sortie |
|---|---|
| `FINISHED` | voir tableau ci-dessous, `status: 'suggested'` |
| `SCHEDULED`, `TIMED`, `IN_PLAY`, `PAUSED`, `EXTRA_TIME`, `PENALTY_SHOOTOUT` | `status: 'pending'` (réessai) |
| `POSTPONED`, `SUSPENDED`, `CANCELLED` | `status: 'postponed'` |

Sur `FINISHED`, l'issue de l'équipe (`win` / `draw` / `loss`) est calculée au score `fullTime` selon que `teamId` est domicile ou extérieur :

| `betType` | win | draw | loss |
|---|---|---|---|
| `victoire` | `gagne` | `perdu` | `perdu` |
| `defaite` | `perdu` | `perdu` | `gagne` |
| `buteur`, `autre` | `null` | `null` | `null` |

`score` = `"{home}-{away}"`. Si `teamId` ne correspond à aucune des deux équipes → `suggested: null` (incohérence, pas de suggestion).

`betType` provient de `series.bet_type`.

## Composants et flux

### 1. `src/lib/football-data.ts` (extraction)

Centralise les appels aujourd'hui dupliqués dans `src/actions/teams.ts` et `src/app/api/cron/daily-summary/route.ts` :

- `fetchTeamFixtures(teamId, { status, limit })`
- `fetchMatch(matchId)`
- `fetchTeamFinishedSince(teamId, dateFrom)` (pour la déduction en secours)

Header `X-Auth-Token`, timeout 8 s (`AbortSignal.timeout(8000)`). `teams.ts` et `daily-summary` sont migrés dessus (ramène `daily-summary` sous 300 lignes).

### 2. `FixturePicker` — `src/components/paris/fixture-picker.tsx`

- Affiché dans `BetForm` si sport = foot et équipe liée à un `api_team_id`.
- Charge les 5 prochains matchs via la route existante `/api/football/fixtures?teamId=`.
- **Pré-sélectionne le plus proche.** Options : autre match, « Aucun match ».
- Remonte `{ fixtureId, fixtureKickoff } | null` au form.
- En cas d'échec de chargement : « Aucun match » sélectionné, pas de blocage du form.

`createBetEntry` accepte `fixtureId?` et `fixtureKickoff?` et les persiste avec `resolution_status = 'pending'` ; si le picker est affiché et « Aucun match » choisi → `resolution_status = 'manual'`. Paris non-foot ou sans équipe liée : `'manual'`.

### 3. Route `src/app/api/cron/resolve-bets/route.ts`

Auth : `Authorization: Bearer ${CRON_SECRET}`. Client Supabase service role. `maxDuration = 60`.

1. **Sélection** (une requête, join `series` pour `bet_type`, `subject`, `user_id`) :
   `result is null` et `resolution_status = 'pending'` et `fixture_kickoff <= now() - 2h` et `fixture_kickoff > now() - 24h`, `limit 20`.
2. **Groupement par `fixture_id`**, max **8 matchs** par passage (quota 10 req/min) ; le reste attend le prochain passage.
3. Pour chaque match : `fetchMatch` → `resolveBet` pour chaque pari rattaché. `teamId` = `api_team_id` du `team_mapping` lié au `subject` via `subject_links`.
4. **Écriture** : `suggested_result`, `fixture_score`, `resolution_status`.
5. **Expiration** : paris `pending` avec `fixture_kickoff <= now() - 24h` → `expired`.
6. **Notif push** à chaque transition vers `suggested` / `postponed` / `expired` (anti-doublon = la transition elle-même).
7. **Secours paris historiques** : paris `result is null`, `fixture_id is null`, `resolution_status is null`, sport foot, équipe liée → `fetchTeamFinishedSince(teamId, created_at)` ; 1er match `FINISHED` trouvé → renseigne `fixture_id`, `fixture_kickoff` et résout dans la foulée ; aucun → `resolution_status = 'expired'` sans notif (traité une seule fois). Partage le même plafond de 8 appels.

Réponse JSON : compteurs `{ checked, suggested, postponed, expired, skipped }`.

### 4. Notifications

Réutilise le pattern web-push de `daily-summary` (`push_subscriptions`, suppression des abonnements 404/410). Respecte `user_settings.notifications_enabled`.

| Transition | Titre | Corps |
|---|---|---|
| `suggested` (victoire/défaite) | `{subject} {score}` | `Pari n°{bet_number} gagné ? Confirme en un tap` (ou `perdu ?`) |
| `suggested` (buteur/autre) | `{subject} {score}` | `Match terminé — valide ton pari n°{bet_number}` |
| `postponed` | `{subject} — match reporté` | `Valide ton pari à la main` |
| `expired` | `{subject} — résultat introuvable` | `Valide ton pari à la main` |

URL de clic : `/` (dashboard, card « À suivre »).

> Buteur/autre : `resolveBet` renvoie `suggested: null` mais `status: 'suggested'` + `score` ; on stocke le score, pas de `suggested_result`.

### 5. `SuggestedResultBadge` — `src/components/bets/suggested-result-badge.tsx`

- Props : `betId`, `fixtureScore`, `suggestedResult`, `resolutionStatus`, `onValidated`.
- `suggested` + `suggestedResult` : « 2-1 · Gagné ? » + **Confirmer** (→ `validateResult(betId, suggestedResult)`) + **Corriger** (affiche les boutons Gagné/Perdu existants).
- `suggested` sans `suggestedResult` : « Terminé 2-1 » au-dessus des boutons Gagné/Perdu.
- `postponed` / `expired` : mention discrète « Match reporté » / « Résultat introuvable ».
- Intégré là où Gagné/Perdu existe : `dashboard/action-items.tsx`, `series/equipe-series-item.tsx`, `equipes/equipes-page.tsx`, `paris/paris-page.tsx`. Les server actions qui alimentent ces vues ajoutent les 3 colonnes à leur `select`.

`validateResult` est inchangé (confetti, suite de série).

## Gestion des erreurs

- API football-data en erreur (5xx, 429, timeout) → pari reste `pending`, log `[resolve-bets]`, pas de notif.
- Match pas terminé à T+2h → `pending`, réessai toutes les 15 min.
- Reporté / suspendu / annulé → `postponed`, notif, plus de retry.
- Pas de score 24h après le coup d'envoi → `expired`, notif, plus de retry.
- Résultat saisi à la main avant le cron → `result is not null` → ignoré.
- **Le cron n'écrit jamais `result`.**

## Tests

- Ajout de **vitest** (devDependency) + script `npm test`.
- `src/lib/bet-resolution.test.ts` : victoire / défaite × win / draw / loss, équipe domicile / extérieur, buteur / autre, statuts en cours, reporté, `teamId` absent du match.
- Gate avant push : `npm test` + `npm run build` + `tsc --noEmit`.
- Validation manuelle : `curl -H "Authorization: Bearer $CRON_SECRET" https://<prod>/api/cron/resolve-bets` avant d'activer `pg_cron`.
- Validation live : un pari réel sur un match du soir → badge + notif ~2h après le coup d'envoi.

## Hors scope v1

- Résolution auto des paris buteur (pas de buteurs fiables en free tier).
- Sports autres que le foot.
- Analyse de cote (edge vs marché).
- Écriture automatique du résultat.
