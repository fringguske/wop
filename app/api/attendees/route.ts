import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, expectedCookieValue } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured, type AttendeeInsert } from "@/lib/supabase";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

export async function POST(request: Request) {
  const expected = await expectedCookieValue();
  const cookieStore = await cookies();

  if (!expected || cookieStore.get(AUTH_COOKIE_NAME)?.value !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const body = await request.json();
  const fullName = cleanText(body.full_name);

  if (!fullName) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 });
  }

  const boarding = body.boarding === true;
  const boardingDaysValue = Number(body.boarding_days);
  const attendee: AttendeeInsert = {
    full_name: fullName,
    phone_number: cleanText(body.phone_number),
    address: cleanText(body.address),
    church: cleanText(body.church),
    gender: cleanText(body.gender),
    category: cleanText(body.category),
    boarding,
    boarding_days: boarding && Number.isFinite(boardingDaysValue) ? boardingDaysValue : null,
  };

  const { error } = await getSupabase().from("attendees").insert(attendee);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
