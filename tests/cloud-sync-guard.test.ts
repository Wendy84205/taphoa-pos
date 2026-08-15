import { describe, expect, it } from "vitest";
import { workspaceBelongsToUser } from "../lib/cloud-sync-guard";

describe("cloud workspace identity guard", () => {
  it("only enables cached workspace data for the authenticated member", () => {
    expect(workspaceBelongsToUser({ membership: { userId: 12 } }, 12)).toBe(true);
    expect(workspaceBelongsToUser({ membership: { userId: 12 } }, 99)).toBe(false);
    expect(workspaceBelongsToUser({ membership: { userId: 12 } }, null)).toBe(false);
  });
});
