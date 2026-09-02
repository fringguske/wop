import { getSupabase, isSupabaseConfigured, Attendee } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AttendeesPage() {
  const { data, error } = isSupabaseConfigured()
    ? await getSupabase().from("attendees").select("*").order("created_at", { ascending: false })
    : { data: [], error: new Error("Supabase is not configured.") };

  const attendees = (data ?? []) as Attendee[];

  return (
    <main className="page-shell page-shell--wide">
      <div className="page-header">
        <div>
          <p className="eyebrow">Registered people</p>
          <h1>Attendees ({attendees.length})</h1>
        </div>
        <Link className="primary-link" href="/register">
          Register new
        </Link>
      </div>

      {error && <p className="status status--error">Could not load attendees.</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Full name</th>
              <th>Phone number</th>
              <th>Address</th>
              <th>Church</th>
              <th>Category</th>
              <th>Gender</th>
              <th>Boarding</th>
              <th>Boarding days</th>
              <th>Registered at</th>
            </tr>
          </thead>
          <tbody>
            {attendees.map((attendee) => (
              <tr key={attendee.id}>
                <td>{attendee.full_name}</td>
                <td>{attendee.phone_number || "-"}</td>
                <td>{attendee.address || "-"}</td>
                <td>{attendee.church || "-"}</td>
                <td>{attendee.category || "-"}</td>
                <td>{attendee.gender || "-"}</td>
                <td>{attendee.boarding ? "Yes" : "No"}</td>
                <td>{attendee.boarding_days ?? "-"}</td>
                <td>{new Date(attendee.created_at).toLocaleString("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "medium", timeStyle: "medium" })}</td></tr>
              </tr>
            ))}
            {!attendees.length && (
              <tr>
                <td colSpan={9} className="empty-row">
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
