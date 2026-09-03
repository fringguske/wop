export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const AUTH_COOKIE_NAME = "event_app_auth";

export type Role = "viewer" | "admin";

function viewerPassword() {
  return (
    process.env.APP_PASSWORD ??
    process.env.EVENT_APP_PASSWORD ??
    process.env.EVENT_PASSWORD ??
    process.env.APP_OTP
  );
}

function adminPassword() {
  return process.env.APP_ADMIN_PASSWORD ?? process.env.OFFICER_PASSWORD;
}

export async function expectedViewerHash(): Promise<string | null> {
  const password = viewerPassword();
  return password ? hashPassword(password) : null;
}

export async function expectedAdminHash(): Promise<string | null> {
  const password = adminPassword();
  return password ? hashPassword(password) : null;
}

export async function isAuthConfigured(): Promise<boolean> {
  return Boolean((await expectedViewerHash()) || (await expectedAdminHash()));
}

export function buildAuthToken(role: Role, hash: string): string {
  return `${role}:${hash}`;
}

export async function verifyAuthToken(token: string | undefined | null): Promise<Role | null> {
  if (!token) {
    return null;
  }

  const viewerHash = await expectedViewerHash();
  const adminHash = await expectedAdminHash();

  if (viewerHash && token === `viewer:${viewerHash}`) {
    return "viewer";
  }

  if (adminHash && token === `admin:${adminHash}`) {
    return "admin";
  }

  return null;
}
