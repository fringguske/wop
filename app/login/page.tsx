import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Event access</p>
        <h1>Officer login</h1>
        <form action={login} className="login-form">
          <label>
            One-time password
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button className="primary-button" type="submit">
            Enter
          </button>
        </form>
        {error === "config" && <p className="status status--error">Set APP_PASSWORD in your environment file.</p>}
        {error && error !== "config" && <p className="status status--error">Wrong password. Try again.</p>}
      </section>
    </main>
  );
}
