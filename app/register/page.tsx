import Link from "next/link";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;

  return (
    <main className="page-shell page-shell--narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Officer entry</p>
          <h1>Register attendee</h1>
        </div>
        <Link className="secondary-link" href="/attendees">
          View list
        </Link>
      </div>

      <RegisterForm />

      {success && <p className="status status--success">Attendee saved.</p>}
      {error === "config" && (
        <p className="status status--error">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
      )}
      {error && error !== "config" && (
        <p className="status status--error">Something went wrong. Check the table setup and try again.</p>
      )}
    </main>
  );
}
