import Image from "next/image";
import Link from "next/link";
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

export default function LoginPage() {
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
            <h2 id="login-title">Sign in</h2>
          </div>

          <form className={styles.loginForm}>
            <button className={styles.ssoButton} type="button">
              <MicrosoftMark />
              Sign-In / Sign-Up using Microsoft
            </button>

            <div className={styles.divider}>or</div>

            <div className={styles.fieldGroup}>
              <label>
                Email address
                <input type="email" name="email" autoComplete="email" placeholder="name@derby.ac.uk" />
              </label>
              <label>
                Password
                <input type="password" name="password" autoComplete="current-password" />
              </label>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.remember}>
                <input type="checkbox" name="remember" />
                Keep me signed in
              </label>
              <Link href="/login">Forgot password?</Link>
            </div>

            <button className={styles.secondaryButton} type="submit">
              Sign in
            </button>
          </form>

          <div className={styles.panelFooter}>
            Need access? <Link className={styles.supportLink} href="/login">Contact your workspace administrator</Link>.
          </div>
        </section>
      </div>
    </main>
  );
}
