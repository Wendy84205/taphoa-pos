import { describe, expect, it } from "vitest";
import { createOAuthState, parseOAuthState } from "../shared/oauth-state";

describe("OAuth state", () => {
  const nonce = "a".repeat(32);
  it("encodes only approved web and native callback destinations with a nonce", () => {
    expect(parseOAuthState(createOAuthState("https://pos.example.com/api/oauth/callback", nonce))).toEqual({ redirectUri: "https://pos.example.com/api/oauth/callback", nonce });
    expect(parseOAuthState(createOAuthState("manus20260814120419://oauth/callback", nonce))).toEqual({ redirectUri: "manus20260814120419://oauth/callback", nonce });
  });

  it("rejects malformed state and unapproved redirect destinations", () => {
    expect(parseOAuthState("invalid")).toBeNull();
    expect(parseOAuthState(createOAuthState("https://attacker.example/steal", nonce))).toBeNull();
    expect(parseOAuthState(createOAuthState("https://pos.example.com/api/oauth/callback", "short"))).toBeNull();
  });
});
