import { describe, expect, it } from "vitest";
import { resolveBet, type MatchResult } from "./bet-resolution";

const HOME = 10;
const AWAY = 20;

function match(
  status: string,
  home: number | null = null,
  away: number | null = null,
): MatchResult {
  return { status, homeTeamId: HOME, awayTeamId: AWAY, fullTime: { home, away } };
}

describe("resolveBet — victoire", () => {
  it("équipe à domicile gagne → gagne", () => {
    expect(resolveBet({ betType: "victoire", teamId: HOME, match: match("FINISHED", 2, 1) }))
      .toEqual({ status: "suggested", suggested: "gagne", score: "2-1" });
  });
  it("équipe à l'extérieur gagne → gagne", () => {
    expect(resolveBet({ betType: "victoire", teamId: AWAY, match: match("FINISHED", 0, 3) }))
      .toEqual({ status: "suggested", suggested: "gagne", score: "0-3" });
  });
  it("match nul → perdu", () => {
    expect(resolveBet({ betType: "victoire", teamId: HOME, match: match("FINISHED", 1, 1) }).suggested)
      .toBe("perdu");
  });
  it("défaite de l'équipe → perdu", () => {
    expect(resolveBet({ betType: "victoire", teamId: AWAY, match: match("FINISHED", 2, 0) }).suggested)
      .toBe("perdu");
  });
});

describe("resolveBet — défaite", () => {
  it("l'équipe perd → gagne", () => {
    expect(resolveBet({ betType: "defaite", teamId: HOME, match: match("FINISHED", 0, 1) }).suggested)
      .toBe("gagne");
  });
  it("match nul → perdu", () => {
    expect(resolveBet({ betType: "defaite", teamId: HOME, match: match("FINISHED", 2, 2) }).suggested)
      .toBe("perdu");
  });
  it("l'équipe gagne → perdu", () => {
    expect(resolveBet({ betType: "defaite", teamId: AWAY, match: match("FINISHED", 0, 1) }).suggested)
      .toBe("perdu");
  });
});

describe("resolveBet — types non résolubles", () => {
  it.each(["buteur", "autre", "Plus de 2,5 buts"])("%s → score sans suggestion", (betType) => {
    expect(resolveBet({ betType, teamId: HOME, match: match("FINISHED", 3, 1) }))
      .toEqual({ status: "suggested", suggested: null, score: "3-1" });
  });
});

describe("resolveBet — statuts", () => {
  it.each(["SCHEDULED", "TIMED", "IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT"])(
    "%s → pending",
    (status) => {
      expect(resolveBet({ betType: "victoire", teamId: HOME, match: match(status) }))
        .toEqual({ status: "pending", suggested: null, score: null });
    },
  );
  it.each(["POSTPONED", "SUSPENDED", "CANCELLED"])("%s → postponed", (status) => {
    expect(resolveBet({ betType: "victoire", teamId: HOME, match: match(status) }))
      .toEqual({ status: "postponed", suggested: null, score: null });
  });
  it("FINISHED sans score → pending", () => {
    expect(resolveBet({ betType: "victoire", teamId: HOME, match: match("FINISHED") }).status)
      .toBe("pending");
  });
});

describe("resolveBet — équipe absente du match", () => {
  it("teamId ne joue pas → score sans suggestion", () => {
    expect(resolveBet({ betType: "victoire", teamId: 99, match: match("FINISHED", 1, 0) }))
      .toEqual({ status: "suggested", suggested: null, score: "1-0" });
  });
  it("teamId null → score sans suggestion", () => {
    expect(resolveBet({ betType: "victoire", teamId: null, match: match("FINISHED", 1, 0) }).suggested)
      .toBeNull();
  });
});
