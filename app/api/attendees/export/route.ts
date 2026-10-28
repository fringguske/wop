import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { formatChildren } from "@/lib/attendees";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured, type Attendee } from "@/lib/supabase";
import { buildXlsx } from "@/lib/xlsx";

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
    columns.map(([header]) => header),
    ...(data ?? []).map((attendee) => columns.map(([, read]) => read(attendee))),
  ];
  const date = new Date().toLocaleDateString("en-CA", { timeZone });

  // A real Excel file rather than CSV, because Excel's phone apps report CSV downloads as corrupted.
  return new NextResponse(new Uint8Array(buildXlsx("Attendees", rows)), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendees-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
