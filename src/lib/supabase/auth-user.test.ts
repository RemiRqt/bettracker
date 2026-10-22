import { describe, expect, it } from "vitest";
import { userFromClaims } from "./auth-user";

describe("userFromClaims", () => {
  it("lit l'id (sub) et l'email du jeton", () => {
    expect(userFromClaims({ sub: "u-1", email: "a@b.fr", role: "authenticated" })).toEqual({ id: "u-1", email: "a@b.fr" });
  });
  it("pas de jeton ou pas de sub : personne de connecté", () => {
    expect(userFromClaims(null)).toBeNull();
    expect(userFromClaims({ email: "a@b.fr" })).toBeNull();
  });
  it("email absent : undefined", () => {
    expect(userFromClaims({ sub: "u-1" })).toEqual({ id: "u-1", email: undefined });
  });
});
