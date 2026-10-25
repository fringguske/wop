import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { formatChildren } from "@/lib/attendees";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured, type Attendee } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const timeZone = "Africa/Nairobi";

const columns: [string, (attendee: Attendee) => string | number | null][] = [
  ["Full name", (attendee) => attendee.full_name],
  ["Phone number", (attendee) => attendee.phone_number],
  ["Address", (attendee) => attendee.address],
  ["Church", (attendee) => attendee.church],
  ["Category", (attendee) => attendee.category],
  ["Gender", (attendee) => attendee.gender],
  ["Registration amount", (attendee) => attendee.registration_amount],
  ["Boarding", (attendee) => (attendee.boarding ? "Yes" : "No")],
  ["Boarding days", (attendee) => attendee.boarding_days],
  ["Boarding schedule", (attendee) => attendee.boarding_schedule?.join(", ") || null],
  ["Children count", (attendee) => attendee.children?.length ?? 0],
  ["Children", (attendee) => formatChildren(attendee.children) || null],
  [
    "Registered at",
    (attendee) =>
      new Date(attendee.created_at).toLocaleString("en-GB", { timeZone, dateStyle: "medium", timeStyle: "short" }),
  ],
];

function csvCell(value: string | number | null) {
  let text = value === null || value === undefined ? "" : String(value);

  // Stop spreadsheet apps from running cell text as a formula, but leave phone numbers like +254... alone.
  if (/^[=+\-@\t\r]/.test(text) && !/^[+-]?[\d\s()-]+$/.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const cookieStore = await cookies();
  const role = await verifyAuthToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const { data, error } = await getSupabase().from("attendees").select("*").order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = [
    columns.map(([header]) => csvCell(header)).join(","),
    ...(data ?? []).map((attendee) => columns.map(([, read]) => csvCell(read(attendee))).join(",")),
  ];
  const date = new Date().toLocaleDateString("en-CA", { timeZone });

  // The BOM makes Excel open the file as UTF-8.
  return new NextResponse(`﻿${rows.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendees-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
