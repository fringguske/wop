"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, expectedCookieValue, hashPassword } from "@/lib/auth";

export async function login(formData: FormData) {
  const entered = formData.get("password") as string;
  const expected = await expectedCookieValue();

  if (!expected) {
    redirect("/login?error=config");
  }

  if ((await hashPassword(entered)) !== expected) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  redirect("/attendees");
}
