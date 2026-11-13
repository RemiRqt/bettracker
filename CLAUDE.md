# BetTracker - Project Rules

> **Pilotage projet** (objectif, plan d'action, décisions, "Reprendre par") :
> `/Users/remi/Documents/Obsidian Vault/2 - PROJETS/bettracker/CLAUDE.md`

## Avant de coder

1. Lire `docs/regles/` : `qualite.md`, `securite.md`, `bdd.md`, `outils.md`, `design.md` (règles reprises de
   `~/projects/_app-template` le 2026-11-13, adaptées).
2. **`npm run verifier` → `VERIFIER OK`** avant tout commit/push (garde-fous, typecheck, lint, format, tests, knip,
   build).

## Règles d'or

- Push sur `master` = prod. Jamais `--no-verify` (lefthook pre-push lance `verifier` ; hook Claude). npm seul.
- Repo **public** : aucun secret dans le code ni l'historique ; valeurs dans Bitwarden (`bwenv bettracker`), toute
  variable lue par le code listée dans `.env.example`.
- Données : RLS `to authenticated` + `(select auth.uid()) = user_id` ; migrations horodatées
  `YYYYMMDDHHMMSS_<sujet>.sql`, essai à blanc puis `sperso db query --linked -f …` (`docs/regles/bdd.md`).
  **Jamais `db push`** (base partagée).
- Chaque mise à jour livrée : entrée dans `src/lib/releases.ts`.
- Commits en français « Zone : changement ».

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (auth + database + RLS)
- Tailwind CSS v4 + Radix UI + shadcn/ui
- Recharts (charts)
- PWA mobile-first, dark theme (slate/emerald)

## Commands

```bash
npm run dev          # Dev server (127.0.0.1:3000)
npm run verifier     # Barrière avant push (garde-fous, typecheck, lint, format, tests, knip, build)
npm test             # Vitest
# Migrations : jamais `supabase db push` — voir docs/regles/bdd.md
```

## Architecture

```
src/
├── app/              # Routing and pages ONLY
│   ├── (app)/        # Protected routes (dashboard, series, calendar, profile)
│   ├── (auth)/       # Auth routes (login, callback)
│   └── api/          # API routes (football proxy)
├── actions/          # Server Actions (mutations + data fetching)
├── components/       # UI components
│   ├── ui/           # shadcn/ui primitives (DO NOT edit)
│   ├── layout/       # Header, nav, bottom-nav
│   └── [feature]/    # Feature components (bets/, series/, dashboard/, etc.)
├── hooks/            # Custom React hooks
└── lib/
    ├── constants.ts  # Enums, config values
    ├── utils.ts      # cn(), formatEuros(), formatPercent()
    ├── supabase/     # Client factories (client.ts, server.ts, middleware.ts)
    └── types/        # TypeScript types (index.ts, database.ts)

supabase/migrations/  # SQL (00001-00027 figées, puis YYYYMMDDHHMMSS_<sujet>.sql)
```

## Data Flow Rules

### Required pattern

```
Page/Component → Server Action (src/actions/) → Supabase
```

### Forbidden patterns

- Component accessing Supabase directly
- Database queries inside UI components
- `select *` queries
- Multiple sequential queries when one join suffices

### Server Actions (src/actions/)

All mutations and data fetching go through server actions. Each file groups related operations:

- `bets.ts` — addBet, validateBetResult
- `series.ts` — createSeries, getSeries, deleteSeries, abandonSeries
- `stats.ts` — getDashboardStats
- `transactions.ts` — addTransaction, getTransactions
- `equipes.ts` — equipe/series management
- `teams.ts` — team mappings, search

When adding a new feature, create or extend an action file — never put Supabase logic in components.

## Auth

- Supabase Auth (Google OAuth + magic link)
- Proxy (`src/proxy.ts`) refreshes the session and redirects to /login (not a security barrier: each action checks the user)
- Server-side: `const supabase = await createClient()` from `lib/supabase/server.ts`
- Client-side: `createClient()` from `lib/supabase/client.ts`
- Always get user with `getAuthUser()` (claims vérifiés), never trust client-side session alone

## Component Rules

1. Components handle UI only — no Supabase, no business logic
2. Feature components go in `components/[feature]/` (bets/, series/, dashboard/, etc.)
3. Use `"use client"` only when needed (hooks, interactivity)
4. Server Components by default
5. Dynamic imports for heavy components:
   ```tsx
   const Chart = dynamic(() => import("./Chart"));
   ```

## File Size Limits

- File: 300 lines max
- Function: 30 lines max
- React component: 200 lines max
- If exceeded, split into smaller files

## Performance

- Initial load: < 1s
- Navigation: < 200ms
- API response: < 150ms
- Always use loading.tsx / Suspense / skeletons — no blank screens
- Paginate all lists (limit 20 default)
- Only fetch required fields from Supabase (`.select("id, name, status")`)

## Database (Supabase)

Tables: `series`, `bets`, `transactions`, `team_mappings`, `equipes`, `logo_cache`

Rules:

- Migrations in `supabase/migrations/` with sequential numbering
- Always add indexes on filtered columns
- Use RLS policies for row-level security
- Batch related queries into single functions (e.g., `getDashboardStats`)
- Always include `.limit()` on queries
- Types auto-generated in `lib/types/database.ts`

## Styling

- Tailwind CSS v4 with custom theme in `globals.css`
- Use `cn()` from `lib/utils.ts` for conditional classes
- Mobile-first approach — design for mobile, adapt for desktop
- Dark theme: slate backgrounds, emerald accents
- Use existing shadcn/ui components before creating new ones

## Error Handling

```tsx
try {
  const data = await serverAction();
} catch (error) {
  console.error("Context:", error);
  // Show user feedback via toast
}
```

Every async operation must handle errors. Users must always get feedback.

## API Routes (src/app/api/)

Used only for external API proxying (RapidAPI/SportAPI). Internal data flows through server actions, not API routes.

- `api/football/fixtures/` — next fixtures
- `api/football/search/` — team search (cached)
- `api/football/image/` — team logos

## Anti-Patterns (FORBIDDEN)

- Database queries in components
- `select *` queries
- Multiple API calls for a single view
- Files > 300 lines
- Unused dependencies
- Heavy libraries loaded at startup
- Missing error handling
- Hardcoded role checks (`if (user.role === "admin")`)
- Editing shadcn/ui primitives in `components/ui/`

## Development Workflow

```
1. Architecture (where does it go?)
2. Server Action (data layer)
3. Database (migration if needed)
4. UI Component (presentation)
5. Error handling
6. Test build (npm run build)
```

Never start with the UI.
