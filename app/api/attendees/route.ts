import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { cleanBoardingSchedule } from "@/lib/boarding";
import { getSupabase, isSupabaseConfigured, type AttendeeInsert } from "@/lib/supabase";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const role = await verifyAuthToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (role !== "admin") {
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
  const boardingSchedule = boarding ? cleanBoardingSchedule(body.boarding_schedule) : [];

  if (boarding && !boardingSchedule.length) {
    return NextResponse.json({ error: "Select at least one boarding day" }, { status: 400 });
  }

  const attendee: AttendeeInsert = {
    full_name: fullName,
    phone_number: cleanText(body.phone_number),
    address: cleanText(body.address),
    church: cleanText(body.church),
    gender: cleanText(body.gender),
    category: cleanText(body.category),
    registration_amount: cleanText(body.registration_amount),
    boarding,
    boarding_days: boarding ? boardingSchedule.length : null,
    boarding_schedule: boardingSchedule,
  };

  const { error } = await getSupabase().from("attendees").insert(attendee);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
