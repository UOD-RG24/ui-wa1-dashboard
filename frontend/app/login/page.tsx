"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { exchangeMicrosoftToken, getAuthStatus, signIn, signUp } from "../lib/api";
import { ApiError } from "../lib/apiClient";
import { getAccessToken, setAccessToken, setStoredUser } from "../lib/authStorage";
import { acquireMicrosoftAccessToken, isMicrosoftAuthConfigured } from "../lib/msal";
import derbyLogo from "../university-of-derby-logo-01.webp";
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

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [microsoftPending, setMicrosoftPending] = useState(false);
  const microsoftConfigured = isMicrosoftAuthConfigured();

  useEffect(() => {
    let cancelled = false;
    async function redirectIfSignedIn() {
      if (!getAccessToken()) return;
      try {
        const status = await getAuthStatus();
        if (!cancelled && status.isSignedIn) {
          router.replace("/");
        }
      } catch {
        // Stay on login when token is invalid.
      }
    }
    void redirectIfSignedIn();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "signup") {
        await signUp({ firstName, lastName, email, password });
      }
      const result = await signIn({ email, password });
      setAccessToken(result.accessToken);
      setStoredUser(result.user);
      router.replace("/");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Sign-in failed. Please try again.";
      setError(message);
    } finally {
      setPending(false);
    }
  };

  const onMicrosoftSignIn = async () => {
    setError(null);
    setMicrosoftPending(true);
    try {
      const microsoftAccessToken = await acquireMicrosoftAccessToken();
      const result = await exchangeMicrosoftToken(microsoftAccessToken);
      setAccessToken(result.accessToken);
      setStoredUser(result.user);
      router.replace("/");
    } catch (err) {
      if (err && typeof err === "object" && "errorCode" in err) {
        const code = String((err as { errorCode?: string }).errorCode ?? "");
        if (code === "user_cancelled" || code === "popup_window_error") {
          setError("Microsoft sign-in was cancelled.");
          return;
        }
      }
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Microsoft sign-in failed. Please try again.";
      setError(message);
    } finally {
      setMicrosoftPending(false);
    }
  };

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginCenter}>
        <div className={styles.brandLockup}>
          <span className={styles.logoMark}>
            <Image src={derbyLogo} alt="University of Derby" priority />
          </span>
          <h1>Multi Omics Dashboard</h1>
        </div>

        <section className={styles.loginPanel} aria-labelledby="login-title">
          <div className={styles.panelHeader}>
            <h2 id="login-title">{mode === "signin" ? "Sign in" : "Create account"}</h2>
          </div>

          <form className={styles.loginForm} onSubmit={onSubmit}>
            <button
              className={styles.ssoButton}
              type="button"
              disabled={!microsoftConfigured || microsoftPending || pending}
              title={
                microsoftConfigured
                  ? "Sign in with Microsoft"
                  : "Set NEXT_PUBLIC_AZURE_AD_CLIENT_ID, TENANT_ID, and API_SCOPE to enable Microsoft sign-in"
              }
              onClick={() => void onMicrosoftSignIn()}
            >
              <MicrosoftMark />
              {microsoftPending
                ? "Signing in with Microsoft…"
                : microsoftConfigured
                  ? "Microsoft sign-in"
                  : "Microsoft sign-in (not configured)"}
            </button>

            <div className={styles.divider}>or</div>

            <div className={styles.fieldGroup}>
              {mode === "signup" ? (
                <>
                  <label>
                    First name
                    <input
                      type="text"
                      name="firstName"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Last name
                    <input
                      type="text"
                      name="lastName"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      required
                    />
                  </label>
                </>
              ) : null}
              <label>
                Email address
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="name@derby.ac.uk"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
            </div>

            {error ? <p className={styles.errorText}>{error}</p> : null}

            <div className={styles.formOptions}>
              <button
                className={styles.linkButton}
                type="button"
                onClick={() => {
                  setMode((current) => (current === "signin" ? "signup" : "signin"));
                  setError(null);
                }}
              >
                {mode === "signin" ? "Need an account? Sign up" : "Already registered? Sign in"}
              </button>
              <Link href="/login">Forgot password?</Link>
            </div>

            <button className={styles.secondaryButton} type="submit" disabled={pending || microsoftPending}>
              {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
            </button>
          </form>

          <div className={styles.panelFooter}>
            Need access?{" "}
            <Link className={styles.supportLink} href="/login">
              Contact your workspace administrator
            </Link>
            .
          </div>
        </section>
      </div>
    </main>
  );
}
