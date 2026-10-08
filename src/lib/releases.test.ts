import { describe, expect, it } from "vitest";
import { LATEST_RELEASE_ID, RELEASES, unseenReleases } from "./releases";

describe("releases", () => {
  it("ids triés du plus récent au plus ancien", () => {
    const ids = RELEASES.map((r) => r.id);
    expect([...ids].sort().reverse()).toEqual(ids);
    expect(LATEST_RELEASE_ID).toBe(ids[0]);
  });
  it("jamais vu → toutes ; à jour → aucune", () => {
    expect(unseenReleases(null)).toHaveLength(RELEASES.length);
    expect(unseenReleases(LATEST_RELEASE_ID)).toHaveLength(0);
    expect(unseenReleases("2000-01-01")).toHaveLength(RELEASES.length);
  });
});
