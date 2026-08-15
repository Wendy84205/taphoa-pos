import { describe, expect, it } from "vitest";
import { getGoogleOAuthReadiness } from "../server/google-auth-config";

describe("Google OAuth configuration readiness", () => {
  it("does not report a ready Google flow before HTTPS and the appropriate client credentials exist", () => {
    expect(getGoogleOAuthReadiness({ GOOGLE_WEB_CLIENT_ID: "web-client" })).toMatchObject({ webReady: false, iosReady: false, androidReady: false, redirectUri: null });
    expect(getGoogleOAuthReadiness({ GOOGLE_WEB_CLIENT_ID: "web-client", GOOGLE_WEB_CLIENT_SECRET: "secret", APP_BASE_URL: "http://localhost:8081" })).toMatchObject({ webReady: false });
  });

  it("reports each platform independently without exposing the secret", () => {
    const readiness = getGoogleOAuthReadiness({
      GOOGLE_WEB_CLIENT_ID: "web-client",
      GOOGLE_WEB_CLIENT_SECRET: "super-secret",
      GOOGLE_IOS_CLIENT_ID: "ios-client",
      GOOGLE_ANDROID_CLIENT_ID: "android-client",
      APP_BASE_URL: "https://pos.example.com/",
    });
    expect(readiness).toEqual({
      webReady: true,
      iosReady: true,
      androidReady: true,
      redirectUri: "https://pos.example.com/api/auth/google/callback",
    });
    expect(JSON.stringify(readiness)).not.toContain("super-secret");
  });
});
