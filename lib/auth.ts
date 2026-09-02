export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const AUTH_COOKIE_NAME = "event_app_auth";

export async function expectedCookieValue(): Promise<string | null> {
  const appPassword =
    process.env.APP_PASSWORD ??
    process.env.EVENT_APP_PASSWORD ??
    process.env.EVENT_PASSWORD ??
    process.env.APP_OTP;

  if (!appPassword) {
    return null;
  }

  return hashPassword(appPassword);
}
