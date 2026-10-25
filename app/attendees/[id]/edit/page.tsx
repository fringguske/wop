import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase, isSupabaseConfigured, Attendee } from "@/lib/supabase";
import LogoutButton from "../../../components/LogoutButton";
import EditAttendeeForm from "./EditAttendeeForm";

export const dynamic = "force-dynamic";

export default async function EditAttendeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = isSupabaseConfigured()
    ? await getSupabase().from("attendees").select("*").eq("id", id).maybeSingle()
    : { data: null, error: new Error("Supabase is not configured.") };

  if (!data && !error) {
    notFound();
  }

  return (
    <main className="page-shell page-shell--narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Superuser</p>
          <h1>Edit attendee</h1>
        </div>
        <div className="header-actions">
          <Link className="secondary-link" href="/attendees">
            View list
          </Link>
          <LogoutButton />
        </div>
      </div>

      {error && <p className="status status--error">Could not load attendee.</p>}
      {data && <EditAttendeeForm attendee={data as Attendee} />}
    </main>
  );
}
