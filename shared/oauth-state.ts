const STATE_SEPARATOR = ".";

export type OAuthState = { redirectUri: string; nonce: string };

export function createOAuthState(redirectUri: string, nonce: string) {
  return `${encodeURIComponent(redirectUri)}${STATE_SEPARATOR}${nonce}`;
}

export function parseOAuthState(state: string): OAuthState | null {
  const separator = state.lastIndexOf(STATE_SEPARATOR);
  if (separator <= 0) return null;
  let redirectUri: string;
  try { redirectUri = decodeURIComponent(state.slice(0, separator)); } catch { return null; }
  const nonce = state.slice(separator + 1);
  if (!redirectUri || !/^[A-Za-z0-9_-]{20,128}$/.test(nonce)) return null;
  try {
    const url = new URL(redirectUri);
    const nativeCallback = /^manus[a-z0-9]+:$/i.test(url.protocol) && url.hostname === "oauth" && url.pathname === "/callback";
    const webCallback = url.protocol === "https:" && url.pathname === "/api/oauth/callback";
    return nativeCallback || webCallback ? { redirectUri, nonce } : null;
  } catch {
    return null;
  }
}
