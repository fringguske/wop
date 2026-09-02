"use client";

import { useState } from "react";
import { login } from "./actions";

export default function LoginForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <form action={login} className="login-form" onSubmit={() => setSubmitted(true)}>
      <label>
        One-time password
        <input type="password" name="password" autoComplete="current-password" required />
      </label>
      <button className="primary-button" type="submit" disabled={submitted}>
        {submitted ? "Entering..." : "Enter"}
      </button>
    </form>
  );
}
