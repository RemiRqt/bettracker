# Règles — Qualité

Reprises de `~/projects/_app-template` via finitopipo (2026-11-13). Push sur `main` = déploiement prod : la barrière
est **locale**.

## TOUJOURS

- Avant tout commit/push : `npm run verifier` → **`VERIFIER OK`** (garde-fous, typecheck, lint, format, tests, knip,
  puis build avec valeurs factices pour les `NEXT_PUBLIC_*` absentes).
- Un test par logique pure (`src/lib/domain/**/*.test.ts`), par règle maison (`src/lint-regles.test.ts`,
  `scripts/garde-fous.test.mjs`).
- Commits en français « Zone : changement », petits, par étape.
- Une règle bloque : corriger le **code**. Désaccord avec une règle : le dire, pas la contourner.

## JAMAIS

- Désactiver une règle ESLint pour passer. `eslint-disable-next-line <règle> -- raison` toléré seulement pour un cas
  voulu et expliqué (ex. appels séquentiels voulus vers une API limitée en débit : football-data, The Odds API).
- `--no-verify`, `LEFTHOOK=0` en local, `test.only` (hook Claude `scripts/hook-bash.mjs` + garde-fous).
- Second lockfile, `next lint`, `.env*` ou `.claude/settings.local.json` commités (garde-fous).

## Hooks et CI

`lefthook` (installé par `npm install`) : pre-commit garde-fous + gitleaks (`brew install gitleaks`) + eslint/prettier
sur les fichiers indexés ; pre-push `npm run verifier`. CI GitHub (`.github/workflows/verifier.yml`) : gitleaks,
`verifier`, `npm audit --omit=dev` (à chaque push et le lundi) — elle **alerte**, elle ne protège pas.
