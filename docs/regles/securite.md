# Règles — Sécurité

Reprises de `~/projects/_app-template` via finitopipo (2026-11-13), adaptées à BetTracker (app **multi-utilisateurs**,
server actions de `src/actions/`, crons appelés par pg_cron).

## TOUJOURS

- Chaque server action et route `src/app/api/**` vérifie elle-même qui appelle : session (`getAuthUser()`,
  `src/lib/supabase/server.ts`) ou `Authorization: Bearer CRON_SECRET` pour `/api/cron/*` (comparaison en temps
  constant, refus si le secret attendu est absent). Le proxy (`src/proxy.ts`) rafraîchit la session ; **ce n'est pas
  une barrière** (CVE-2025-29927).
- Admin (`ADMIN_EMAILS`) vérifié côté serveur, jamais seulement en masquant un bouton.
- Identité = l'utilisateur de la session, jamais un id venu du client. La clé de service
  (`createServiceClient()`, `src/lib/supabase/service.ts`, crons et admin seulement) filtre toujours par `user_id`.
- Valider toute entrée externe (FormData, corps, query, réponses des API sport) : types, longueurs max.
- Erreurs : message générique au client, détail dans les logs serveur sans donnée perso.
- Variables d'env : toutes listées (noms) dans `.env.example` (garde-fous) ; valeurs dans Bitwarden (`bwenv
bettracker`), jamais affichées ni écrites. Le repo GitHub est **public** : rien de sensible dans le code ni l'historique
  (incident du 2026-10-10 : clé service committée, clés tournées).
- `npm audit --omit=dev` (CI) ; next ≥ 16.4.5.

## JAMAIS

- `SUPABASE_SERVICE_ROLE_KEY` (ou tout secret) côté client ou préfixé `NEXT_PUBLIC_` (garde-fous).
- Autorisation décidée uniquement dans le proxy ou un layout.
- `dangerouslySetInnerHTML` sur un contenu saisi ou venu d'une API ; `href` externe sans vérifier `https:`.
- Route de debug/test (garde-fous : `src/app/**/test|debug|tmp…` refusé sauf `garde-fou: route-autorisee` + raison ;
  `/api/test/push` supprimée le 2026-11-13).
- `--no-verify`, `git add -f` (hook Claude).
