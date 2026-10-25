import { cookies } from "next/headers";
import Link from "next/link";
import { AUTH_COOKIE_NAME, canDelete, canRegister, verifyAuthToken } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured, Attendee } from "@/lib/supabase";
import LogoutButton from "../components/LogoutButton";
import DeleteAttendeeButton from "./DeleteAttendeeButton";

export const dynamic = "force-dynamic";

const timeZone = "Africa/Nairobi";

function formatRegisteredAt(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AttendeesPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  const role = await verifyAuthToken(token);
  const showRegister = canRegister(role);
  const showDelete = canDelete(role);

  const { data, error } = isSupabaseConfigured()
    ? await getSupabase().from("attendees").select("*").order("created_at", { ascending: true })
    : { data: [], error: new Error("Supabase is not configured.") };

  const attendees = (data ?? []) as Attendee[];

  return (
    <main className="page-shell page-shell--wide">
      <div className="page-header">
        <div>
          <p className="eyebrow">Registered people</p>
          <h1>Attendees ({attendees.length})</h1>
        </div>
        <div className="header-actions">
          <a className="secondary-link" href="/api/attendees/export" download>
            Download CSV
          </a>
          <Link className="secondary-link" href="/statistics">
            View statistics
          </Link>
          {showRegister && (
            <Link className="primary-link" href="/register">
              Register new
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      {error && <p className="status status--error">Could not load attendees.</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Full name</th>
              <th>Phone number</th>
              <th>Address</th>
              <th>Church</th>
              <th>Category</th>
              <th>Gender</th>
              <th>Registration amount</th>
              <th>Boarding</th>
              <th>Boarding days</th>
              <th>Registered at</th>
              {showDelete && <th aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {attendees.map((attendee, index) => (
              <tr key={attendee.id}>
                <td>{index + 1}</td>
                <td>{attendee.full_name}</td>
                <td>{attendee.phone_number || "-"}</td>
                <td>{attendee.address || "-"}</td>
                <td>{attendee.church || "-"}</td>
                <td>{attendee.category || "-"}</td>
                <td>{attendee.gender || "-"}</td>
                <td>{attendee.registration_amount || "-"}</td>
                <td>{attendee.boarding ? "Yes" : "No"}</td>
                <td>{attendee.boarding_schedule?.length ? attendee.boarding_schedule.join(", ") : attendee.boarding_days ?? "-"}</td>
                <td>{formatRegisteredAt(attendee.created_at)}</td>
                {showDelete && (
                  <td>
                    <DeleteAttendeeButton id={attendee.id} name={attendee.full_name} />
                  </td>
                )}
              </tr>
            ))}
            {!attendees.length && (
              <tr>
                <td colSpan={showDelete ? 12 : 11} className="empty-row">
                  No attendees registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
