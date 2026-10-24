export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const AUTH_COOKIE_NAME = "event_app_auth";

export type Role = "viewer" | "admin" | "superuser";

export function canRegister(role: Role | null) {
  return role === "admin" || role === "superuser";
}

export function canDelete(role: Role | null) {
  return role === "superuser";
}

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

function superuserPassword() {
  return process.env.APP_SUPERUSER_PASSWORD;
}

export async function expectedViewerHash(): Promise<string | null> {
  const password = viewerPassword();
  return password ? hashPassword(password) : null;
}

export async function expectedAdminHash(): Promise<string | null> {
  const password = adminPassword();
  return password ? hashPassword(password) : null;
}

export async function expectedSuperuserHash(): Promise<string | null> {
  const password = superuserPassword();
  return password ? hashPassword(password) : null;
}

export async function isAuthConfigured(): Promise<boolean> {
  return Boolean((await expectedViewerHash()) || (await expectedAdminHash()) || (await expectedSuperuserHash()));
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
  const superuserHash = await expectedSuperuserHash();

  if (viewerHash && token === `viewer:${viewerHash}`) {
    return "viewer";
  }

  if (adminHash && token === `admin:${adminHash}`) {
    return "admin";
  }

  if (superuserHash && token === `superuser:${superuserHash}`) {
    return "superuser";
  }

  return null;
}
