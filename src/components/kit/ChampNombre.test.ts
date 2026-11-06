import { describe, expect, it } from "vitest";
import { normaliserDecimal } from "./ChampNombre";

describe("normaliserDecimal", () => {
  it("convertit la virgule", () => expect(normaliserDecimal("1,85")).toBe("1.85"));
  it("garde un seul séparateur", () => expect(normaliserDecimal("1.8.5")).toBe("1.85"));
  it("retire le reste", () => expect(normaliserDecimal("12 €a")).toBe("12"));
  it("vide reste vide", () => expect(normaliserDecimal("")).toBe(""));
});
