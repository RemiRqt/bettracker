# Cotes du marché à la création d'un pari — Design

**Date** : 2026-10-08
**Statut** : validé en brainstorming, à planifier

## Objectif

Quand Rémi crée un pari foot (victoire / défaite) sur un match rattaché, l'app **appelle The Odds API**, affiche les cotes de **ses** bookmakers pour l'issue pariée, **préremplit la cote** avec la meilleure, montre l'écart entre sa cote et le marché, **stocke** les cotes du marché sur le pari, et affiche une **stat « valeur vs marché »** sur le dashboard.

## Décisions

| Sujet | Décision |
|---|---|
| Source | **The Odds API v4** (the-odds-api.com), offre Starter FREE 500 crédits/mois. Clé `ODDS_API_KEY` (Vercel prod + dev, posée le 2026-10-08). |
| Bookmakers | Région `fr` : `winamax_fr`, `betclic_fr`, `unibet_fr`, `pmu_fr`, `netbet_fr`. Chaque user **choisit les siens dans Profil** et **ne voit que ceux-là** (défaut : les 5). |
| Marché | `h2h` (1N2). `victoire` = cote de l'équipe ; `defaite` = cote de l'adversaire. `buteur` / `autre` : pas de cotes. |
| Chargement | À la sélection du match dans le form (appel API), **cache 5 min** par championnat partagé entre users (1 crédit = toutes les cotes h2h d'un championnat). |
| Préremplissage | Champ « Cote » prérempli avec la meilleure cote parmi les bookmakers cochés, sauf si déjà saisi ; tap sur un bookmaker = remplit la cote. |
| Stockage | Meilleure cote, moyenne et détail **calculés sur les bookmakers cochés** au moment de la création. |
| Stats | Ligne dans la card Capital du dashboard, à partir de 3 paris avec cotes. |

Constats du 2026-10-08 (appel réel Ligue 1, 1 crédit) : 18 matchs ; bookmakers présents `winamax_fr`, `unibet_fr`, `betclic_fr`, `netbet_fr` — **PMU absent** en pratique (mention dans Profil : « souvent indisponible »). Noms : `Paris Saint Germain`, `Paris FC`, `RC Lens`, `AS Monaco`, `Le Mans FC` ; issue nul = `Draw`. `Paris Saint Germain - Le Mans FC` et `Lorient - Paris FC` ont le **même coup d'envoi** (2026-10-10T18:45Z).

## Modèle de données — migration `00022_market_odds.sql`

`bets` :

| Colonne | Type | Rôle |
|---|---|---|
| `market_odds_best` | `numeric null` | Meilleure cote parmi les bookmakers cochés pour l'issue pariée |
| `market_odds_avg` | `numeric null` | Moyenne de ces cotes |
| `market_odds_detail` | `jsonb null` | `{ "winamax_fr": 2.15, "betclic_fr": 2.10 }` |

`user_settings.bookmakers text[] not null default '{winamax_fr,betclic_fr,unibet_fr,pmu_fr,netbet_fr}'` (check : sous-ensemble non vide des 5 clés).

Table `odds_cache` :

| Colonne | Type |
|---|---|
| `sport_key` | `text primary key` |
| `events` | `jsonb not null` (réponse brute `/odds`) |
| `fetched_at` | `timestamptz not null` |
| `requests_remaining` | `integer null` (header `x-requests-remaining`) |

RLS activée sur `odds_cache` sans policy (service role uniquement).

## Correspondance championnats — `src/lib/odds-api.ts`

| Code football-data | `sport_key` |
|---|---|
| `FL1` | `soccer_france_ligue_one` |
| `FL2` | `soccer_france_ligue_two` |
| `PL` | `soccer_epl` |
| `PD` | `soccer_spain_la_liga` |
| `SA` | `soccer_italy_serie_a` |
| `BL1` | `soccer_germany_bundesliga` |
| `CL` | `soccer_uefa_champs_league` |
| `EL` | `soccer_uefa_europa_league` |
| `WC` | `soccer_fifa_world_cup` |
| `EC` | `soccer_uefa_european_championship` |

Code absent → pas de cotes (bloc masqué).

Appel : `GET /v4/sports/{sport_key}/odds?apiKey=…&regions=fr&markets=h2h&oddsFormat=decimal` (timeout 8 s). Toujours les 5 bookmakers FR (même coût) ; filtrage par user à l'affichage.

`getLeagueOdds(supabase, sportKey)` : lit `odds_cache` (service role) ; si `fetched_at` < 5 min → retourne ; sinon appel API → upsert cache (avec `requests_remaining`) → retourne. Erreur API → `null`.

## Rapprochement — `src/lib/odds-matching.ts` (pur, testé)

- `normalizeTeamName(s)` : minuscules, accents retirés, ponctuation → espace, retrait des mots vides `fc, cf, sc, ac, afc, rc, as, club, de, the, cd, ud, ss`, espaces compactés.
- `sameTeam(a, b)` : égalité des formes normalisées, ou inclusion en mots entiers lorsque la plus courte fait ≥ 2 mots (ex. `paris saint germain` ⊂ `paris saint germain fc` ; mais `paris` ≠ `paris saint germain`).
- `findEvent(events, { kickoff, homeNames, awayNames })` : événements à ± 2 h du coup d'envoi ; retient celui dont `home_team` correspond à un des `homeNames` **ou** `away_team` à un des `awayNames` ; si plusieurs, celui qui matche les deux côtés ; sinon `null`. `homeNames` / `awayNames` = `[name, shortName]` football-data.
- `outcomePrices(event, side, betType)` : `side` = `'home' | 'away'` (côté de l'équipe pariée). `victoire` → prix de l'issue au nom de `home_team`/`away_team` correspondant à `side` ; `defaite` → prix de l'autre côté ; autre type → `null`. Retour `{ [bookmakerKey]: price }`.
- `summarize(prices, allowed)` : filtre sur les bookmakers cochés → `{ best, avg, detail }` (arrondis à 2 décimales) ou `null` si vide.

Cas de test obligatoires (données réelles du 2026-10-08) : PSG (`Paris Saint-Germain FC` / `PSG`) ↔ `Paris Saint Germain - Le Mans FC`, **pas** `Lorient - Paris FC` (même heure) ; `RC Lens - Lyon` avec `Olympique Lyonnais`/`Lyon` côté extérieur ; écart > 2 h → `null` ; victoire domicile / extérieur ; défaite = adversaire ; `summarize` limité aux bookmakers cochés ; bookmaker coché absent du retour (PMU) ignoré.

## Données transmises par les matchs

`/api/football/fixtures` ajoute à chaque fixture : `homeTeamId`, `awayTeamId`, `homeTeamName`, `awayTeamName` (noms complets), `competitionCode`. (`homeTeam` / `awayTeam` restent les noms courts.)

## Serveur

- `getMarketOdds(input)` (`src/actions/odds.ts`, server action, user authentifié) : input `{ competitionCode, kickoff, teamId, homeTeamId, homeNames, awayNames, betType }` → lit les bookmakers cochés du user → `getLeagueOdds` → `findEvent` → `outcomePrices` → renvoie `{ prices: {bk: price} (filtré), best, avg, bestBookmaker } | { unavailable: true } | null` (null = championnat non couvert / match introuvable / type non coté).
- `createBetEntry` : `CreateBetInput.marketOdds?: Record<string, number>` → serveur recalcule `best` / `avg` sur ces prix et stocke `market_odds_best`, `market_odds_avg`, `market_odds_detail`.
- `saveBookmakers(keys: string[])` (`src/actions/notifications.ts`) : valide sous-ensemble non vide des 5 clés, upsert `user_settings`.
- `getNotificationSettings` renvoie aussi `bookmakers`.

## UI

- **`useMarketOdds`** (hook) + **`MarketOdds`** (`src/components/paris/market-odds.tsx`) : affiché si foot + match choisi + `betType ∈ {victoire, defaite}` + code championnat couvert. Titre « Cotes du marché · {équipe} {vainqueur|battu} » ; une pastille par bookmaker coché disponible, meilleure marquée ★, pastille sélectionnée surlignée ; tap = `onPick(price)`. Chargement : spinner. Indisponible : « Cotes indisponibles ». Rechargé quand le match ou le type change.
- **Préremplissage** : à l'arrivée des cotes, si le champ « Cote » est vide → meilleure cote (déclenche le recalcul de mise existant via `onOddsChange`).
- **Écart** sous le champ Cote : « Ta cote X · ±a % vs meilleure · ±b % vs moyenne » ; vert si ta cote ≥ moyenne, rouge sinon.
- `bet-form.tsx` : uniquement le branchement (`MarketOdds`, état `marketPrices`, ajout au payload). Pas de logique dedans.
- **Profil** : carte « Mes bookmakers » (`src/components/profile/bookmaker-settings.tsx`), 5 interrupteurs, au moins un coché, sauvegarde immédiate ; PMU annoté « souvent indisponible ».
- **Dashboard** : ligne dans `CapitalPanel` : « Valeur vs marché : +2,3 % · 12 paris · meilleure cote prise 8/12 ». Calcul dans `getDashboardStats` (`src/actions/stats.ts`) sur les paris avec `market_odds_avg` : moyenne de `odds / market_odds_avg − 1` ; « meilleure cote prise » = `odds ≥ market_odds_best − 0.005`. Masquée sous 3 paris.
- **Admin** (carte « Résultats auto (admin) ») : affiche « Crédits Odds API restants : N » (max `requests_remaining` le plus récent de `odds_cache`), en rouge sous 50.

## Erreurs

- Clé absente, 401, 429 (quota), 5xx, timeout → `getLeagueOdds` = null → « Cotes indisponibles », form utilisable, rien stocké.
- Championnat non couvert / match introuvable / type non coté → bloc masqué.
- Aucun bookmaker coché disponible pour ce match → « Cotes indisponibles pour tes bookmakers ».

## Tests

- vitest `src/lib/odds-matching.test.ts` (cas ci-dessus, fixture JSON tronquée de l'appel réel du 2026-10-08 dans `src/lib/__fixtures__/odds-ligue1.json`).
- Gate : `npm test` + `tsc --noEmit` + `npm run build`.
- Validation prod : appel réel Ligue 1 (cache rempli, crédits lus) ; Rémi : cocher 2 bookmakers → créer un pari PSG victoire → seuls ces 2 visibles, cote préremplie, écart affiché → pari enregistré avec `market_odds_*` ; stat dashboard après 3 paris.

## Hors scope

- Paris buteur / autre, marchés autres que h2h.
- Cotes historiques (payant).
- Sports autres que le foot.
- Mise à jour des cotes après création.
