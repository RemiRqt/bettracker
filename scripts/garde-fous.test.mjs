import { describe, expect, it } from "vitest";
import { controler } from "./garde-fous.mjs";

const BASE = {
  "package.json": JSON.stringify({ packageManager: "npm@11.19.0", scripts: { lint: "eslint ." } }),
  ".gitignore": ".env*.local\n.claude/settings.local.json\n.vercel\n*.tsbuildinfo\ntest-results\nsupabase/.temp\n",
  ".env.example": "PUSH_SECRET=\n# AI_GROQ_MODEL=\n",
};
const verifier = (fichiers) => controler(Object.keys(fichiers), (f) => ({ ...BASE, ...fichiers })[f] ?? "");
const MIGRATION_OK = "begin;\ncreate table public.t (id uuid);\ncommit;\n";

describe("garde-fous", () => {
  it("dépôt sain : aucune erreur", () => {
    expect(verifier({ "src/a.ts": "export const a = process.env.PUSH_SECRET ?? process.env.AI_GROQ_MODEL;" })).toEqual([]);
  });
  it("refuse .env, second lockfile, variable non documentée, .only", () => {
    expect(verifier({ ".env.local": "" })[0]).toMatch(/fichier interdit/);
    expect(verifier({ "bun.lock": "" })[0]).toMatch(/second lockfile/);
    expect(verifier({ "src/a.ts": "process.env.INCONNUE" })[0]).toMatch(/INCONNUE/);
    expect(verifier({ "src/a.test.ts": "it." + "only('x', () => {})" })[0]).toMatch(/\.only/);
  });
  it("migrations historiques tolérées, nouvelles horodatées et encadrées", () => {
    expect(verifier({ "supabase/migrations/00013_freebets_and_sport.sql": "using (true)" })).toEqual([]);
    expect(verifier({ "supabase/migrations/20261113120000_essai.sql": MIGRATION_OK })).toEqual([]);
    expect(verifier({ "supabase/migrations/00028_essai.sql": MIGRATION_OK })[0]).toMatch(/mal nommée/);
    expect(verifier({ "supabase/migrations/20261113120000_essai.sql": "create table public.t (id uuid);" })[0]).toMatch(/begin/);
  });
  it("refuse les politiques laxistes, les droits anon, security definer sans search_path", () => {
    const m = (corps) => verifier({ "supabase/migrations/20261113120000_essai.sql": `begin;\n${corps}\ncommit;\n` });
    expect(m("create policy p on public.t for select to authenticated using (true);")[0]).toMatch(/trop large/);
    expect(m("create policy p on public.t for select to authenticated using (auth.uid() is not null);")[0]).toMatch(/trop large/);
    expect(m("grant select on public.t to anon;")[0]).toMatch(/anon/);
    expect(m("create function public.f() returns int language sql security definer as $$ select 1 $$;")[0]).toMatch(/search_path/);
  });
});
