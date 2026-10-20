"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./LoginPage.module.css";

function MicrosoftMark() {
  return (
    <span className={styles.microsoftIcon} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export function LoginForm({
  microsoftEnabled,
  localEnabled,
}: {
  microsoftEnabled: boolean;
  localEnabled: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function localSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setBusy(false);
    if (result?.error) {
      setError("The email or password was not accepted.");
      return;
    }
    router.replace("/pipeline");
    router.refresh();
  }

  return (
    <form className={styles.loginForm} onSubmit={localSignIn}>
      {microsoftEnabled ? (
        <button
          className={styles.ssoButton}
          type="button"
          disabled={busy}
          onClick={() => signIn("microsoft-entra-id", { redirectTo: "/pipeline" })}
        >
          <MicrosoftMark />
          Sign in or register with Microsoft
        </button>
      ) : null}

      {microsoftEnabled && localEnabled ? <div className={styles.divider}>development only</div> : null}

      {localEnabled ? (
        <>
          <div className={styles.fieldGroup}>
            <label>
              Email address
              <input type="email" name="email" autoComplete="email" required />
            </label>
            <label>
              Password
              <input type="password" name="password" autoComplete="current-password" required />
            </label>
          </div>
          <button className={styles.secondaryButton} type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in with local JWT"}
          </button>
        </>
      ) : null}

      {!microsoftEnabled && !localEnabled ? (
        <p className={styles.authNotice}>Authentication has not been configured for this deployment.</p>
      ) : null}
      {error ? <p className={styles.authError} role="alert">{error}</p> : null}
    </form>
  );
}
