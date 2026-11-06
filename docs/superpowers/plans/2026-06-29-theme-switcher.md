# Thème configurable (Actuel / Vert tapis / Clair papier) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à chaque utilisateur de choisir le thème visuel de l'app (Actuel, Vert tapis, Clair papier) depuis sa page `/profile`, avec persistance et zéro flash au chargement ; ajouter un splash animé et le préchargement des routes.

**Architecture:** On tokenise toutes les couleurs codées en dur vers les tokens sémantiques Tailwind v4 déjà présents dans `globals.css`. Les 3 thèmes sont des blocs CSS `[data-theme="..."]` qui surchargent ces tokens. Le choix est stocké dans un cookie non-httpOnly `bt-theme`, lu côté serveur dans le root layout pour rendre `<html data-theme=...>` (pas de FOUC) et écrit côté client pour un feedback instantané. Splash et préchargement sont des composants client montés dans le layout `(app)`.

**Tech Stack:** Next.js 16 (App Router, RSC), React 19, Tailwind CSS v4 (`@theme` CSS-first), lucide-react, Supabase (auth), PWA (`viewport-fit: cover`).

## Global Constraints

- Tailwind **v4** : les tokens themables sont définis avec `@theme { ... }` (PAS `@theme inline` — l'inline empêche la surcharge runtime des variables). Les utilitaires générés référencent `var(--color-*)`, donc surcharger la variable sous `[data-theme]` suffit.
- Le thème **« actuel » = valeurs par défaut au `:root`** (issues de `@theme`). Les défauts des tokens DOIVENT rester les couleurs actuelles exactes pour que la tokenisation soit un refactor **sans changement visuel** sur le thème par défaut.
- Cookie : nom `bt-theme`, valeurs `actuel | turf | creme`, `path=/`, `max-age=31536000` (1 an), `SameSite=Lax`, **non httpOnly** (lu en SSR ET en client JS).
- Accent **auto** : chaque thème définit son propre `--color-primary` (actuel→emerald `#10b981`, turf→or `#fbbf24`, creme→vert `#16a34a`). Aucun sélecteur d'accent séparé.
- Splash = animation **fade + zoom** uniquement. Arrondi = **doux** (défaut actuel, rien à changer).
- **Pas de test runner** dans le projet (`package.json` scripts = dev/build/start/lint). Les portes de vérification sont : `grep` (zéro couleur figée résiduelle dans le périmètre), `npm run build`, `npm run lint`, et **vérification visuelle** des 3 thèmes. Respecter `prefers-reduced-motion`.
- Déploiement : commit + push direct sur `master` → auto-deploy Vercel (projet perso). Ne PAS pousser sans demande explicite.

## Table de correspondance couleur → token (référence pour toutes les tâches de tokenisation)

| Couleur figée | Token / classe cible |
|---|---|
| `#0f172a`, `bg-slate-900`, `bg-slate-900/40` | `bg-background` (+ modificateur d'opacité `/40`) |
| `#1e293b`, `bg-slate-800`, `bg-slate-800/60` | `bg-card` (+ `/60`) |
| `bg-slate-700`, `bg-slate-700/50` | `bg-muted` (+ `/50`) |
| `#10b981`, `bg-emerald-500`, `bg-emerald-500/10\|15\|20` | `bg-primary` (+ `/10` `/15` `/20`) |
| `text-emerald-400`, `text-emerald-300`, `text-emerald-400/70` | `text-primary` (+ `/70`) |
| `border-emerald-500`, `border-emerald-500/20\|30\|50` | `border-primary` (+ opacité) |
| `#ffffff`, `text-white`, `text-slate-100` | `text-foreground` |
| `text-slate-200`, `text-slate-300` | `text-secondary-foreground` |
| `text-slate-400`, `text-slate-500`, `text-slate-600` | `text-muted-foreground` |
| `#475569`, `border-slate-500\|600\|700`, `border-slate-700/50\|60` | `border-border` (+ opacité) |
| `#ef4444`, `bg-red-500`, `bg-red-500/10\|20` | `bg-destructive` (+ opacité) |
| `text-red-400`, `text-red-300`, `text-red-400/70` | `text-destructive` (+ opacité) |
| `border-red-500/20\|30` | `border-destructive` (+ opacité) |
| `#f59e0b`, `text-amber-400`, `bg-amber-500\|600`, `bg-amber-500/20` | `text-warning` / `bg-warning` (token AJOUTÉ tâche 1) |
| `#3b82f6`, `text-blue-400`, `bg-blue-500\|/20`, `border-blue-500/20\|30` | `text-info` / `bg-info` / `border-info` (token AJOUTÉ tâche 1) |
| `#022c22` | `text-primary-foreground` |
| Couleurs de graphiques (`#8b5cf6`, `#fbbf24`, `#a78bfa`, `#34d399`, `#60a5fa`, `#feedba`) | `--color-chart-*` existants (laisser si purement décoratif dans un graphe) |

> Règle : si une couleur figée n'a pas d'équivalent sémantique évident (ex. couleur de série de graphe), la laisser et la **lister** dans le commit ; ne pas inventer de token.

---

### Task 1: Fondations — tokens + 3 thèmes

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: tokens `--color-warning`, `--color-warning-foreground`, `--color-info` ; blocs `[data-theme="turf"]` et `[data-theme="creme"]` surchargeant l'ensemble des `--color-*`. Toutes les tâches suivantes consomment ces tokens.

- [ ] **Step 1: Ajouter les tokens manquants dans `@theme`**

Dans le bloc `@theme { ... }` de `globals.css`, après `--color-destructive-foreground`, ajouter :

```css
  --color-warning: #f59e0b;
  --color-warning-foreground: #1c1200;
  --color-info: #3b82f6;
  --color-info-foreground: #ffffff;
```

- [ ] **Step 2: Définir les blocs de thème (après le `@theme`, avant `@layer base`)**

```css
/* ===== Thèmes (accent = --color-primary de chaque thème) ===== */
/* "actuel" = valeurs par défaut du :root ci-dessus. */

[data-theme="turf"] {
  --color-background: #0e1f1a;
  --color-foreground: #e8f5ee;
  --color-card: #16352b;
  --color-card-foreground: #e8f5ee;
  --color-popover: #16352b;
  --color-popover-foreground: #e8f5ee;
  --color-primary: #fbbf24;
  --color-primary-foreground: #2a1c00;
  --color-secondary: #1d4536;
  --color-secondary-foreground: #b9d8c8;
  --color-muted: #1d4536;
  --color-muted-foreground: #8fb8a4;
  --color-accent: #1d4536;
  --color-accent-foreground: #e8f5ee;
  --color-border: #256048;
  --color-input: #256048;
  --color-ring: #fbbf24;
  --color-warning: #fbbf24;
  --color-info: #5eead4;
  --color-sidebar-background: #0e1f1a;
  --color-sidebar-accent: #16352b;
  --color-sidebar-border: #256048;
}

[data-theme="creme"] {
  --color-background: #f7f4ec;
  --color-foreground: #1c1917;
  --color-card: #fffdf8;
  --color-card-foreground: #1c1917;
  --color-popover: #fffdf8;
  --color-popover-foreground: #1c1917;
  --color-primary: #16a34a;
  --color-primary-foreground: #ffffff;
  --color-secondary: #f3eee2;
  --color-secondary-foreground: #4a4036;
  --color-muted: #f3eee2;
  --color-muted-foreground: #7c7263;
  --color-accent: #f3eee2;
  --color-accent-foreground: #1c1917;
  --color-border: #e7e0d0;
  --color-input: #e7e0d0;
  --color-ring: #16a34a;
  --color-destructive: #dc2626;
  --color-warning: #d97706;
  --color-info: #2563eb;
  --color-sidebar-background: #f7f4ec;
  --color-sidebar-accent: #fffdf8;
  --color-sidebar-border: #e7e0d0;
}
```

- [ ] **Step 3: Vérifier le build**

Run: `npm run build`
Expected: build OK, aucune erreur Tailwind.

- [ ] **Step 4: Vérifier la surcharge (manuel)**

Lancer `npm run dev`, ouvrir les devtools, sur `<html>` ajouter `data-theme="creme"`. Attendu : `getComputedStyle(document.documentElement).getPropertyValue('--color-background')` renvoie `#f7f4ec`.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): tokens warning/info + thèmes turf & creme"
```

---

### Task 2: Tokeniser le chrome de l'app (header, navbar, layout)

**Files:**
- Modify: `src/components/layout/app-header.tsx`
- Modify: `src/components/layout/bottom-nav.tsx`
- Modify: `src/components/layout/nav-links.tsx`
- Modify: `src/components/layout/route-transition.tsx`
- Modify: `src/app/(app)/layout.tsx`

**Interfaces:**
- Consumes: tokens de Task 1.
- Produces: chrome 100 % token-driven (référence visuelle pour vérifier les thèmes sur les tâches suivantes).

- [ ] **Step 1: Appliquer la table de correspondance**

Remplacer dans ces fichiers chaque couleur figée par son token (cf. table). Exemples concrets :
- `app-header.tsx` : `bg-[#0f172a]/95` → `bg-background/95` ; `border-slate-700/50` → `border-border/50` ; `text-white` → `text-foreground`.
- `bottom-nav.tsx` : `bg-[#1e293b]/90` → `bg-card/90` ; `border-slate-700/50` → `border-border/50` ; `bg-emerald-500/15` → `bg-primary/15` ; `text-emerald-400` → `text-primary` ; `text-slate-500` → `text-muted-foreground`.
- `(app)/layout.tsx` : `bg-[#0f172a]` → `bg-background`.
- `route-transition.tsx` : barre emerald → `bg-primary`.

- [ ] **Step 2: Vérifier qu'aucune couleur figée ne subsiste dans ces fichiers**

Run:
```bash
grep -nE "#[0-9a-fA-F]{6}|(text|bg|border)-(slate|emerald|amber|gray|white|red|blue)" \
  src/components/layout/app-header.tsx src/components/layout/bottom-nav.tsx \
  src/components/layout/nav-links.tsx src/components/layout/route-transition.tsx \
  src/app/\(app\)/layout.tsx
```
Expected: aucune sortie.

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: OK.

- [ ] **Step 4: Vérification visuelle (thème actuel inchangé)**

`npm run dev` → l'app en thème `actuel` doit être **visuellement identique** à la prod. Aucun écart.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout src/app/\(app\)/layout.tsx
git commit -m "refactor(theme): tokenise le chrome (header, navbar, layout)"
```

---

### Task 3: Cookie de thème + application SSR

**Files:**
- Create: `src/lib/theme.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces:
  - `export type Theme = "actuel" | "turf" | "creme"`
  - `export const THEMES: { id: Theme; label: string; hint: string }[]`
  - `export const DEFAULT_THEME: Theme = "actuel"`
  - `export const THEME_COOKIE = "bt-theme"`
  - `export function isTheme(v: string | undefined): v is Theme`
  - `export async function getServerTheme(): Promise<Theme>` (lit le cookie via `next/headers`)

- [ ] **Step 1: Créer `src/lib/theme.ts`**

```ts
import { cookies } from "next/headers";

export type Theme = "actuel" | "turf" | "creme";

export const THEME_COOKIE = "bt-theme";
export const DEFAULT_THEME: Theme = "actuel";

export const THEMES: { id: Theme; label: string; hint: string }[] = [
  { id: "actuel", label: "Actuel", hint: "Ardoise sombre, accent emerald" },
  { id: "turf", label: "Vert tapis", hint: "Pelouse profonde, accent or" },
  { id: "creme", label: "Clair papier", hint: "Fond clair, accent vert" },
];

export function isTheme(v: string | undefined): v is Theme {
  return v === "actuel" || v === "turf" || v === "creme";
}

export async function getServerTheme(): Promise<Theme> {
  const store = await cookies();
  const v = store.get(THEME_COOKIE)?.value;
  return isTheme(v) ? v : DEFAULT_THEME;
}
```

- [ ] **Step 2: Appliquer le thème sur `<html>` dans le root layout**

Dans `src/app/layout.tsx`, rendre `RootLayout` async et lire le thème :

```tsx
import { getServerTheme } from "@/lib/theme";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getServerTheme();
  return (
    <html lang="fr" data-theme={theme}>
      {/* ...inchangé... */}
    </html>
  );
}
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: OK (la route est déjà dynamique via Supabase ; `cookies()` ne casse rien).

- [ ] **Step 4: Vérifier l'application SSR**

`npm run dev` → dans la console navigateur : `document.cookie = "bt-theme=creme;path=/"` puis recharger (F5). Attendu : `<html data-theme="creme">` dès le premier rendu (voir le HTML source / pas de flash sombre).

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.ts src/app/layout.tsx
git commit -m "feat(theme): lecture du cookie bt-theme + data-theme en SSR"
```

---

### Task 4: Sélecteur de thème dans `/profile`

**Files:**
- Create: `src/components/profile/theme-selector.tsx`
- Modify: `src/app/(app)/profile/page.tsx`

**Interfaces:**
- Consumes: `THEMES`, `THEME_COOKIE`, `Theme`, `getServerTheme` (Task 3).
- Produces: `<ThemeSelector current={theme} />` (client).

- [ ] **Step 1: Créer le composant client `theme-selector.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { THEMES, THEME_COOKIE, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeSelector({ current }: { current: Theme }) {
  const [theme, setTheme] = useState<Theme>(current);

  function apply(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => apply(t.id)}
          aria-pressed={theme === t.id}
          className={cn(
            "relative flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
            theme === t.id
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:bg-muted"
          )}
        >
          {theme === t.id && (
            <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-semibold text-foreground">{t.label}</span>
          <span className="text-xs text-muted-foreground">{t.hint}</span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Monter le sélecteur dans la page profil**

Dans `src/app/(app)/profile/page.tsx`, importer `getServerTheme` et `ThemeSelector`, et ajouter une section (suivre la structure de section existante de la page) :

```tsx
import { getServerTheme } from "@/lib/theme";
import { ThemeSelector } from "@/components/profile/theme-selector";

// dans le composant (page server async) :
const theme = await getServerTheme();

// dans le JSX, une nouvelle section :
<section className="space-y-3">
  <h2 className="text-sm font-semibold text-muted-foreground">Apparence</h2>
  <ThemeSelector current={theme} />
</section>
```

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: OK.

- [ ] **Step 4: Vérification fonctionnelle**

`npm run dev` → `/profile` : cliquer un thème change l'app **instantanément** ; recharger la page → le thème choisi persiste (cookie lu en SSR).

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/theme-selector.tsx src/app/\(app\)/profile/page.tsx
git commit -m "feat(theme): sélecteur de thème dans /profile"
```

---

### Task 5: Tokeniser le dashboard (page d'accueil)

**Files:**
- Modify: `src/app/(app)/page.tsx` et les composants qu'elle utilise (les localiser via grep ci-dessous).

- [ ] **Step 1: Localiser les fichiers du périmètre**

Run:
```bash
grep -rlE "#[0-9a-fA-F]{6}|(text|bg|border)-(slate|emerald|amber|white|red|blue)" \
  src/app/\(app\)/page.tsx src/components/dashboard src/components/home 2>/dev/null
```
(adapter aux dossiers réellement présents).

- [ ] **Step 2: Appliquer la table de correspondance** sur ces fichiers.

- [ ] **Step 3: Vérifier l'absence de couleur figée**

Run: même `grep` qu'au Step 1. Expected: aucune sortie.

- [ ] **Step 4: Build + vérif visuelle des 3 thèmes**

`npm run build` puis `npm run dev` → basculer Actuel / Vert tapis / Clair papier depuis `/profile` : le dashboard s'adapte correctement (texte lisible en clair, accents cohérents).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor(theme): tokenise le dashboard"
```

---

### Task 6: Tokeniser Séries (liste, détail, nouveau)

**Files:**
- Modify: `src/app/(app)/series/page.tsx`, `src/app/(app)/series/[id]/page.tsx`, `src/app/(app)/series/new/page.tsx` + composants associés (`src/components/series/*`).

- [ ] **Step 1: Localiser**
Run: `grep -rlE "#[0-9a-fA-F]{6}|(text|bg|border)-(slate|emerald|amber|white|red|blue)" src/app/\(app\)/series src/components/series 2>/dev/null`
- [ ] **Step 2: Appliquer la table de correspondance.**
- [ ] **Step 3: Vérifier l'absence de couleur figée** (même grep, zéro sortie).
- [ ] **Step 4: Build + vérif visuelle 3 thèmes.**
- [ ] **Step 5: Commit** `git add -A && git commit -m "refactor(theme): tokenise les séries"`

---

### Task 7: Tokeniser Freebets + Calendrier

**Files:**
- Modify: `src/app/(app)/freebets/page.tsx`, `src/app/(app)/calendar/page.tsx` + composants associés.

- [ ] **Step 1: Localiser**
Run: `grep -rlE "#[0-9a-fA-F]{6}|(text|bg|border)-(slate|emerald|amber|white|red|blue)" src/app/\(app\)/freebets src/app/\(app\)/calendar src/components/freebets src/components/calendar 2>/dev/null`
- [ ] **Step 2: Appliquer la table** (les accents amber des freebets → `text-warning`/`bg-warning`).
- [ ] **Step 3: Vérifier l'absence de couleur figée.**
- [ ] **Step 4: Build + vérif visuelle 3 thèmes.**
- [ ] **Step 5: Commit** `git add -A && git commit -m "refactor(theme): tokenise freebets + calendrier"`

---

### Task 8: Tokeniser Profil + Auth + UserMenu

**Files:**
- Modify: `src/app/(app)/profile/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/components/auth/user-menu.tsx` + composants associés.

- [ ] **Step 1: Localiser**
Run: `grep -rlE "#[0-9a-fA-F]{6}|(text|bg|border)-(slate|emerald|amber|white|red|blue)" src/app/\(app\)/profile src/app/\(auth\) src/components/auth 2>/dev/null`
- [ ] **Step 2: Appliquer la table de correspondance.**
- [ ] **Step 3: Vérifier l'absence de couleur figée.**
- [ ] **Step 4: Build + vérif visuelle 3 thèmes.**
- [ ] **Step 5: Commit** `git add -A && git commit -m "refactor(theme): tokenise profil + auth"`

---

### Task 9: Tokeniser les primitives UI + graphiques

**Files:**
- Modify: `src/components/ui/*` (boutons, cartes, toaster, confirm-dialog, etc.) et tout composant de graphe.

- [ ] **Step 1: Localiser le reste de l'app**
Run: `grep -rlE "#[0-9a-fA-F]{6}|(text|bg|border)-(slate|emerald|amber|white|red|blue)" src/components/ui 2>/dev/null`
- [ ] **Step 2: Appliquer la table.** Les couleurs de séries de graphes purement décoratives → `--color-chart-*` (laisser si non sémantiques, lister dans le message de commit).
- [ ] **Step 3: Vérifier** — grep global de contrôle :
Run: `grep -rnE "#[0-9a-fA-F]{6}|(text|bg|border)-(slate|emerald)" src --include="*.tsx" | grep -v chart`
Attendu : ne restent que des cas justifiés (à lister).
- [ ] **Step 4: Build + lint + vérif visuelle 3 thèmes.**
- [ ] **Step 5: Commit** `git add -A && git commit -m "refactor(theme): tokenise les primitives UI"`

---

### Task 10: Splash screen (fade + zoom)

**Files:**
- Create: `src/components/layout/splash-screen.tsx`
- Modify: `src/app/(app)/layout.tsx` (monter `<SplashScreen />`)
- Modify: `src/app/globals.css` (keyframes)

**Interfaces:**
- Produces: `<SplashScreen />` (client) — overlay plein écran, logo `public/icons/icon-512.png`, fade+zoom, auto-dismiss.

- [ ] **Step 1: Keyframes dans `globals.css`** (après `@layer base`)

```css
@keyframes splash-logo { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
@keyframes splash-out  { to { opacity: 0; visibility: hidden; } }
@media (prefers-reduced-motion: reduce) {
  .splash-logo-anim { animation: none !important; opacity: 1 !important; }
}
```

- [ ] **Step 2: Créer `splash-screen.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      style={{
        animation: hidden ? "splash-out .45s ease forwards" : undefined,
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/icon-512.png"
        alt=""
        width={112}
        height={112}
        className="splash-logo-anim rounded-3xl shadow-2xl"
        style={{ animation: "splash-logo .7s cubic-bezier(.2,.7,.2,1) both" }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Monter dans `(app)/layout.tsx`** (premier enfant du conteneur racine, avant `<AppHeader />`).

```tsx
import { SplashScreen } from "@/components/layout/splash-screen";
// ...
<div className="min-h-screen bg-background">
  <SplashScreen />
  <AppHeader email={user.email!} />
  {/* ... */}
</div>
```

- [ ] **Step 4: Build**
Run: `npm run build` → OK.

- [ ] **Step 5: Vérif visuelle**
`npm run dev` → au chargement, le logo apparaît (fade+zoom) puis l'overlay s'efface ; en `prefers-reduced-motion`, logo statique + fondu court.

- [ ] **Step 6: Commit**
```bash
git add src/components/layout/splash-screen.tsx src/app/\(app\)/layout.tsx src/app/globals.css
git commit -m "feat(splash): écran de chargement logo fade+zoom"
```

---

### Task 11: Préchargement de toutes les routes

**Files:**
- Create: `src/components/layout/route-prefetcher.tsx`
- Modify: `src/app/(app)/layout.tsx`

**Interfaces:**
- Produces: `<RoutePrefetcher />` (client, ne rend rien).

- [ ] **Step 1: Créer `route-prefetcher.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES = ["/", "/series", "/series/new", "/freebets", "/calendar", "/profile"];

export function RoutePrefetcher() {
  const router = useRouter();
  useEffect(() => {
    ROUTES.forEach((r) => router.prefetch(r));
  }, [router]);
  return null;
}
```

- [ ] **Step 2: Monter dans `(app)/layout.tsx`** (n'importe où dans le conteneur racine).

```tsx
import { RoutePrefetcher } from "@/components/layout/route-prefetcher";
// ...
<RoutePrefetcher />
```

- [ ] **Step 3: Build**
Run: `npm run build` → OK.

- [ ] **Step 4: Vérif réseau**
`npm run dev` → onglet Réseau : des requêtes de préchargement RSC partent au chargement ; la navigation entre onglets est quasi instantanée.

- [ ] **Step 5: Commit**
```bash
git add src/components/layout/route-prefetcher.tsx src/app/\(app\)/layout.tsx
git commit -m "feat(nav): précharge toutes les routes au chargement"
```

---

### Task 12: Vérification finale + nettoyage

**Files:**
- Delete: `design-preview.html`

- [ ] **Step 1: Grep global de contrôle**
Run: `grep -rnE "#[0-9a-fA-F]{6}|(text|bg|border)-(slate|emerald)" src --include="*.tsx" | grep -v chart`
Attendu : seulement des cas justifiés et documentés.

- [ ] **Step 2: Build + lint**
Run: `npm run build && npm run lint` → OK.

- [ ] **Step 3: Passe visuelle complète** des 3 thèmes sur toutes les pages (dashboard, séries, freebets, calendrier, profil, login) : lisibilité, contrastes, accents, ombres sticker.

- [ ] **Step 4: Supprimer le mockup**
```bash
git rm design-preview.html
git commit -m "chore: retire le mockup design-preview.html"
```

---

## Self-Review

- **Couverture spec :** tokenisation (T2,5-9) ✓ · 3 thèmes (T1) ✓ · sélecteur profil (T4) ✓ · persistance cookie+SSR (T3) ✓ · splash fade-zoom (T10) ✓ · prefetch (T11) ✓ · arrondi doux = défaut (rien à faire) ✓ · accent auto = `--color-primary` par thème (T1) ✓.
- **Placeholders :** code complet fourni pour T1,3,4,10,11 ; les tâches de tokenisation sont pilotées par la table de correspondance + grep (contenu concret).
- **Cohérence des types :** `Theme`, `THEME_COOKIE`, `getServerTheme`, `THEMES`, `isTheme` définis en T3 et réutilisés tels quels en T4.
- **Risque connu :** la collapse 6→3 des nuances de gris du texte peut décaler très légèrement quelques teintes en thème « actuel » ; vérifier en T2/T5-9 que ça reste fidèle, ajuster un token si un écart saute aux yeux.
