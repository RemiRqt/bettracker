# Règles — Outils, dépendances et code

Reprises de `~/projects/_app-template` via finitopipo (2026-11-13), adaptées.

## Stack

Next 16.4.x (App Router, server actions `src/actions/`, `src/proxy.ts`, build `--webpack`) · React 19.3.x ·
TypeScript strict · Tailwind 4 · shadcn (Radix) + kit FR (`docs/regles/design.md`) · Recharts · Supabase
(`@supabase/ssr`) · web-push 3.6 · Vitest 5 · lefthook · **npm uniquement** (Node ≥ 24, `.npmrc` `min-release-age=3`).

## TOUJOURS

- `npm` seul, un seul lockfile. Versions vérifiées avec `npm view <paquet> version`.
- Flux : composant → action serveur (`src/actions/`) → Supabase. Un composant n'importe jamais
  `@/lib/supabase/server` ni `@/lib/theme.server` (ESLint).
- Tailles (ESLint) : fichier ≤ 300 lignes, composant ≤ 200, fonction de logique `.ts` ≤ 40 → découper.
- `cn` maison depuis `@/lib/utils` (sans tailwind-merge) ; après un `npx shadcn add`, remplacer l'import du paquet
  npm « cn ».
- `Promise.all` pour les lectures indépendantes (ESLint `no-await-in-loop`) ; appels séquentiels vers les API sport
  limitées en débit seulement avec `eslint-disable-next-line no-await-in-loop -- raison`.
- Tailles de texte de l'échelle Tailwind (`text-xs` = 12 px plancher).
- Code mort : `npm run knip` (dans `verifier`).
- Chaque mise à jour livrée : entrée en tête de `src/lib/releases.ts` (popup « Nouveautés »).

## Interdits (ESLint)

`cn` (paquet), `tailwind-merge`, `sonner`, `react-hook-form`, `next/router`, `zod` complet dans un fichier
`"use client"`, `router.refresh()`, `location.reload()`, `alert/confirm/prompt`, `<select>` et saisies natives,
couleurs en dur, `dark:`, `maximumScale`/`userScalable`, `console.log`, promesses non attendues, `!` non-null.

## Worktrees des agents

`.claude/settings.json` : `worktree.baseRef: "head"`. Aucun `.env.local` dans un worktree : `npm run verifier`
construit avec des valeurs factices.
