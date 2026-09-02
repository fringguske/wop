import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-panel">
        <p className="eyebrow">Event rEGistration access</p>
        <h1>login</h1>
        <LoginForm />
        {error === "config" && <p className="status status--error">Set APP_PASSWORD in your environment file.</p>}
        {error && error !== "config" && <p className="status status--error">Wrong password. Try again.</p>}
      </section>
    </main>
  );
}
