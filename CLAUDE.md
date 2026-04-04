# BetTracker - Project Rules

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (auth + database + RLS)
- Tailwind CSS v4 + Radix UI + shadcn/ui
- Recharts (charts)
- PWA mobile-first, dark theme (slate/emerald)

## Commands

```bash
npm run dev          # Dev server (127.0.0.1:3000)
npm run build        # Production build
npm run lint         # ESLint
npx supabase db push # Push migrations
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

supabase/migrations/  # SQL migrations (8 files)
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
- Middleware (`middleware.ts`) protects all routes except /login, /auth, /api/football/image
- Server-side: `const supabase = await createClient()` from `lib/supabase/server.ts`
- Client-side: `createClient()` from `lib/supabase/client.ts`
- Always get user with `supabase.auth.getUser()`, never trust client-side session alone

## Component Rules

1. Components handle UI only — no Supabase, no business logic
2. Feature components go in `components/[feature]/` (bets/, series/, dashboard/, etc.)
3. Use `"use client"` only when needed (hooks, interactivity)
4. Server Components by default
5. Dynamic imports for heavy components:
   ```tsx
   const Chart = dynamic(() => import("./Chart"))
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
  const data = await serverAction()
} catch (error) {
  console.error("Context:", error)
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
