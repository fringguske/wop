"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  buildAuthToken,
  expectedAdminHash,
  expectedSuperuserHash,
  expectedViewerHash,
  hashPassword,
  type Role,
} from "@/lib/auth";

export async function login(formData: FormData) {
  const entered = (formData.get("password") as string) ?? "";
  const enteredHash = await hashPassword(entered);

  const superuserHash = await expectedSuperuserHash();
  const adminHash = await expectedAdminHash();
  const viewerHash = await expectedViewerHash();

  let role: Role | null = null;
  if (superuserHash && enteredHash === superuserHash) {
    role = "superuser";
  } else if (adminHash && enteredHash === adminHash) {
    role = "admin";
  } else if (viewerHash && enteredHash === viewerHash) {
    role = "viewer";
  }

  if (!role) {
    if (!superuserHash && !adminHash && !viewerHash) {
      redirect("/login?error=config");
    }
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, buildAuthToken(role, enteredHash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  redirect("/attendees");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}
