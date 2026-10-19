"use client";

import { useEffect, useState } from "react";
import { Panel } from "../../components/ui/Panel";
import { Section } from "../../components/ui/Section";
import ui from "../../components/ui/Ui.module.css";
import styles from "../ProfilePage.module.css";

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
};

export function LiveProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/core/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Profile could not be loaded.");
        const value = (await response.json()) as { user: Profile };
        setProfile(value.user);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);
  return (
    <Section title="Live profile">
      <Panel title={profile ? `${profile.firstName} ${profile.lastName}` : "Researcher"} meta={profile?.role ?? "Loading"}>
        {error ? <p>{error}</p> : null}
        {profile ? (
          <dl className={styles.profileGrid}>
            <div><dt>Name</dt><dd>{profile.firstName} {profile.lastName}</dd></div>
            <div><dt>Email</dt><dd>{profile.email}</dd></div>
            <div><dt>Role</dt><dd>{profile.role}</dd></div>
            <div><dt>Status</dt><dd>{profile.status}</dd></div>
          </dl>
        ) : <p className={ui.muted}>Loading the authenticated core API profile…</p>}
      </Panel>
    </Section>
  );
}
