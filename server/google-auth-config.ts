type GoogleEnvironment = Record<string, string | undefined>;

function value(env: GoogleEnvironment, key: string): string | null {
  const candidate = env[key]?.trim();
  return candidate || null;
}

/** Chỉ tiết lộ readiness, tuyệt đối không trả OAuth secret xuống client. */
export function getGoogleOAuthReadiness(env: GoogleEnvironment = process.env) {
  const webClientId = value(env, "GOOGLE_WEB_CLIENT_ID");
  const webClientSecret = value(env, "GOOGLE_WEB_CLIENT_SECRET");
  const appBaseUrl = value(env, "APP_BASE_URL")?.replace(/\/+$/, "");
  const iosClientId = value(env, "GOOGLE_IOS_CLIENT_ID");
  const androidClientId = value(env, "GOOGLE_ANDROID_CLIENT_ID");
  const validBaseUrl = Boolean(appBaseUrl && /^https:\/\//.test(appBaseUrl));
  return {
    webReady: Boolean(webClientId && webClientSecret && validBaseUrl),
    iosReady: Boolean(iosClientId && validBaseUrl),
    androidReady: Boolean(androidClientId && validBaseUrl),
    redirectUri: validBaseUrl ? `${appBaseUrl}/api/auth/google/callback` : null,
  };
}
