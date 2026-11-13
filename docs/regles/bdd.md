# Règles — Base de données (Supabase)

Reprises de `~/projects/_app-template` via finitopipo (2026-11-13), adaptées. Contexte : **projet Supabase partagé**
(`voimkeolnigofzrafkvn`), BetTracker vit dans le schéma **`public`** ; `auth.users` est **commun** avec d'autres apps
(House, finitopipo…). BetTracker est multi-utilisateurs : chacun ne voit que **ses** lignes.

## TOUJOURS

- Nouvelle migration : `supabase/migrations/YYYYMMDDHHMMSS_<sujet>.sql` (`date -u +%Y%m%d%H%M%S`), encadrée
  `begin;` … `commit;`. Les migrations `00001` à `00027` sont figées (déjà en prod) ; les garde-fous refusent un
  nouveau fichier numéroté.
- **RLS sur toute table**, une politique par commande, `to authenticated`, condition
  `(select auth.uid()) = user_id` (ou via la série parente pour `bets`). UPDATE : `using` **et** `with check`.
  Tables de cache partagées (`odds_cache`) : lecture `to authenticated` seulement, écriture par la clé de service.
- Tables/colonnes anglais, `snake_case`. `id uuid primary key default gen_random_uuid()`, `timestamptz`,
  `user_id uuid not null references auth.users(id) on delete cascade`, **un index par FK** et par colonne de RLS.
- Toute fonction : `set search_path = ''`, noms qualifiés, `revoke execute … from public, anon`.
- Crons : pg_cron → `/api/cron/*` avec le secret dans Vault (`resolve_bets_cron_secret`).

## Appliquer en prod (session principale seulement)

Pas de base locale : essai **à blanc** sur la prod puis application.

1. À blanc : la migration sans `commit;` suivie de vérifications (`set local role authenticated` +
   `request.jwt.claims`) et de `rollback;` → `sperso db query --linked -f /tmp/essai.sql`.
2. Application : `sperso db query --linked -f supabase/migrations/<fichier>.sql` (CLI v3 : `--remote --yes`).

## JAMAIS

- `supabase db push`, `migration up`, `db reset`, `migration repair` (journal global partagé entre apps) ; `db query`
  sans `--linked` — refusés par le hook Claude.
- Politique `using (true)`, `auth.uid() is not null`, ou `to public` : un compte d'une autre app lirait les paris.
- Modifier ou renommer une migration déjà appliquée ; toucher aux schémas ou tables d'autres apps (`house`,
  `finitopipo`, `tahiti`, tables `tahitrip_*` / `dinos` encore dans `public`).
- `float` pour de l'argent dans du nouveau code ; `timestamp` sans fuseau ; `select('*')`.
- Supprimer des données ou toucher à la sécurité sans un oui de Rémi.
