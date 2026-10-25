import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cleanAttendee } from "@/lib/attendees";
import { AUTH_COOKIE_NAME, canRegister, verifyAuthToken } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const role = await verifyAuthToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!canRegister(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const result = cleanAttendee(await request.json());

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { error } = await getSupabase().from("attendees").insert(result.attendee);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
