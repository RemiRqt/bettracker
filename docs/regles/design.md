# Bibliothèque d'interface et règles de design

Modèle : finitopipo (`~/projects/finitopipo/docs/regles/design.md`). Audit d'origine :
`docs/audits/2026-11-06-a11y-perf.md`.

## Trois étages de composants

| Dossier | Contenu | Règle |
|---|---|---|
| `src/components/ui/` | **shadcn/ui** (Radix) : `button`, `card`, `input`, `textarea`, `label`, `badge`, `dialog`, `alert-dialog`, `drawer`, `collapsible`, `select`, `tabs`, `toast`… | `npx shadcn@latest add <nom>` (`components.json`), puis **remplacer `import { cn } from "cn"` par `@/lib/utils`** et désinstaller le paquet `cn` s'il revient. Ne modifier que pour le thème ou le tactile. |
| `src/components/kit/` | Composants de l'app, en français, sur `ui/` : `Popup` (feuille du bas sur téléphone, fenêtre sur ordinateur, chargée à la demande), `Confirmation`, `Bouton` (`enCours`), `Champ` / `ZoneTexte` (libellé relié), `Puces` (`aria-pressed`), `Section` (repliable), `EtatVide` | **Premier réflexe** pour toute nouvelle interface. Un besoin répété dans deux écrans → il rejoint le kit. |
| `src/components/[feature]/` | Écrans | Construits avec le kit. |

## Couleurs

- **Seule source : les tokens de `src/app/globals.css`** (thèmes `actuel`, `turf`, `creme`).
- Classes : `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `bg-primary` + `text-primary-foreground`, `destructive`, `warning`, `info`, `bg-overlay` (voile), `chart-1…5`.
- Texte posé sur une couleur pleine : son `-foreground`.
- Couleurs impossibles en token (meta theme-color, confettis) : **`src/lib/theme.ts`**, seule exception ESLint (+ la planche `styleguide/colors-section.tsx`).
- **Interdit** (bloqué par ESLint) : hexadécimal, `rgb()` / `oklch()`, palette Tailwind brute (`bg-blue-500`, `text-white`…).

## Accessibilité (minimum)

- Zoom jamais bloqué ; champs ≥ 16 px sur tactile.
- Tout champ a un libellé relié (`Champ`), tout bouton icône a un `aria-label`.
- Sélections : `aria-pressed` (`Puces`) ; zones repliables : `aria-expanded`.
- Zone de toucher ≥ 44 px ; focus visible (`:focus-visible` global) ; animations coupées si « réduire les animations ».
- Contraste AA (4,5:1) vérifié à chaque nouveau token.

## Perf

- Ce qui n'est pas visible à l'ouverture (formulaires en popup, nouveautés, graphiques) se charge par `next/dynamic`.
- Pages : requêtes en `Promise.all`, colonnes explicites, filtre `user_id`, pas d'écriture au rendu.

## Garde-fous

- `npm run lint` (ESLint flat config) : couleurs en dur (erreur), imports serveur dans un composant (erreur), fichier ≤ 300 lignes / composant ≤ 200 lignes (**avertissement** jusqu'au découpage du lot 5, puis erreur).
- Gate avant push : `npm run lint && npx tsc --noEmit && npm test && npm run build`.
