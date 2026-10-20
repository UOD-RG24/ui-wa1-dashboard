import Image from "next/image";
import Link from "next/link";
import derbyLogo from "../university-of-derby-logo-01.webp";
import { LoginForm } from "./LoginForm";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const microsoftEnabled = Boolean(
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID,
  );
  const localEnabled = process.env.NODE_ENV !== "production" && process.env.ALLOW_LOCAL_AUTH === "true";
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

          <LoginForm microsoftEnabled={microsoftEnabled} localEnabled={localEnabled} />

          <div className={styles.panelFooter}>
            Need a non-production preview? <Link className={styles.supportLink} href="/pipeline?mode=demo">Open isolated demo data</Link>.
          </div>
        </section>
      </div>
    </main>
  );
}
