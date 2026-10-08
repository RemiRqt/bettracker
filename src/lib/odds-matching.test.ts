import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/odds-ligue1.json";
import {
  bestPerOutcome,
  findEvent,
  normalizeTeamName,
  outcomePrices,
  sameTeam,
  summarize,
  type OddsEvent,
} from "./odds-matching";

// Appel réel The Odds API, Ligue 1, 2026-10-08 (tronqué à 4 matchs).
const events = fixture as OddsEvent[];

const PSG = ["Paris Saint-Germain FC", "PSG"];
const LE_MANS = ["Le Mans FC", "Le Mans"];
const LENS = ["Racing Club de Lens", "RC Lens"];
const LYON = ["Olympique Lyonnais", "Lyon"];

describe("normalizeTeamName / sameTeam", () => {
  it("retire accents, ponctuation et mots vides", () => {
    expect(normalizeTeamName("Paris Saint-Germain FC")).toBe("paris saint germain");
    expect(normalizeTeamName("Club Atlético de Madrid")).toBe("atletico madrid");
    expect(normalizeTeamName("RC Lens")).toBe("lens");
  });
  it("égalité et inclusion multi-mots", () => {
    expect(sameTeam("Paris Saint Germain", "Paris Saint-Germain FC")).toBe(true);
    expect(sameTeam("Le Mans FC", "Le Mans")).toBe(true);
    expect(sameTeam("Lyon", "Lyon")).toBe(true);
  });
  it("pas d'inclusion sur un seul mot", () => {
    expect(sameTeam("Paris FC", "Paris Saint-Germain FC")).toBe(false);
    expect(sameTeam("Paris FC", "PSG")).toBe(false);
    expect(sameTeam("Real Sociedad", "Real Madrid CF")).toBe(false);
  });
});

describe("findEvent", () => {
  it("trouve PSG – Le Mans et pas Lorient – Paris FC (même heure)", () => {
    const e = findEvent(events, { kickoff: "2026-10-10T18:45:00Z", homeNames: PSG, awayNames: LE_MANS });
    expect(e?.home_team).toBe("Paris Saint Germain");
  });
  it("trouve par le seul côté extérieur (Lyon)", () => {
    const e = findEvent(events, { kickoff: "2026-10-09T18:45:00Z", homeNames: ["Inconnu"], awayNames: LYON });
    expect(e?.away_team).toBe("Lyon");
  });
  it("tolère un décalage < 2h", () => {
    const e = findEvent(events, { kickoff: "2026-10-09T20:00:00Z", homeNames: LENS, awayNames: LYON });
    expect(e?.home_team).toBe("RC Lens");
  });
  it("écart > 2h → null", () => {
    expect(findEvent(events, { kickoff: "2026-10-09T22:00:00Z", homeNames: LENS, awayNames: LYON })).toBeNull();
  });
  it("aucune équipe reconnue → null", () => {
    expect(findEvent(events, { kickoff: "2026-10-10T18:45:00Z", homeNames: ["Nantes"], awayNames: ["Nice"] })).toBeNull();
  });
});

describe("outcomePrices", () => {
  const psgEvent = events.find((e) => e.home_team === "Paris Saint Germain")!;
  const lensEvent = events.find((e) => e.home_team === "RC Lens")!;

  it("victoire domicile = cote de l'équipe à domicile", () => {
    expect(outcomePrices(psgEvent, "home", "victoire")).toEqual({
      winamax_fr: 1.05, unibet_fr: 1.04, betclic_fr: 1.05, netbet_fr: 1.04,
    });
  });
  it("victoire extérieur", () => {
    expect(outcomePrices(lensEvent, "away", "victoire")?.betclic_fr).toBe(2.68);
  });
  it("défaite = cote de l'adversaire", () => {
    expect(outcomePrices(psgEvent, "home", "defaite")?.winamax_fr).toBe(17);
  });
  it("buteur / autre → null", () => {
    expect(outcomePrices(psgEvent, "home", "buteur")).toBeNull();
    expect(outcomePrices(psgEvent, "home", "autre")).toBeNull();
  });
});

describe("summarize", () => {
  const prices = { winamax_fr: 2.65, unibet_fr: 2.55, betclic_fr: 2.68, netbet_fr: 2.67 };
  it("limité aux bookmakers cochés", () => {
    expect(summarize(prices, ["winamax_fr", "unibet_fr"])).toEqual({
      best: 2.65, avg: 2.6, bestBookmaker: "winamax_fr", detail: { winamax_fr: 2.65, unibet_fr: 2.55 },
    });
  });
  it("bookmaker coché absent (PMU) ignoré", () => {
    expect(summarize(prices, ["pmu_fr", "betclic_fr"])?.detail).toEqual({ betclic_fr: 2.68 });
  });
  it("aucun bookmaker disponible → null", () => {
    expect(summarize(prices, ["pmu_fr"])).toBeNull();
  });
});

describe("bestPerOutcome", () => {
  const psgEvent = events.find((e) => e.home_team === "Paris Saint Germain")!;
  it("meilleure cote + bookmaker par issue, limité aux bookmakers cochés", () => {
    expect(bestPerOutcome(psgEvent, ["winamax_fr", "betclic_fr"])).toEqual({
      home: { price: 1.05, bookmaker: "winamax_fr" },
      draw: { price: 12, bookmaker: "winamax_fr" },
      away: { price: 23, bookmaker: "betclic_fr" },
    });
  });
  it("aucun bookmaker coché disponible → null", () => {
    expect(bestPerOutcome(psgEvent, ["pmu_fr"])).toBeNull();
  });
});
