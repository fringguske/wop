import Link from "next/link";
import RegisterForm from "./RegisterForm";
import LogoutButton from "../components/LogoutButton";

export default function RegisterPage() {
  return (
    <main className="page-shell page-shell--narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Officer entry</p>
          <h1>Register attendee</h1>
        </div>
        <div className="header-actions">
          <Link className="secondary-link" href="/attendees">
            View list
          </Link>
          <LogoutButton />
        </div>
      </div>

      <RegisterForm />
    </main>
  );
}
