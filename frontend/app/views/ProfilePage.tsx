"use client";

import data from "../data/dashboard.json";
import { useAppShell } from "../components/providers/AppProviders";
import { ConfirmModalModel } from "../models/modal";
import { ToastModel } from "../models/toast";
import { DataTable } from "../components/ui/DataTable";
import { Panel } from "../components/ui/Panel";
import { Section } from "../components/ui/Section";
import ui from "../components/ui/Ui.module.css";
import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  const { showModal, showToast } = useAppShell();
  const profile = data.profile;

  const handleDelete = () => {
    showModal(
      new ConfirmModalModel({
        title: "Delete profile",
        description: "This will permanently remove your profile and activity history from this workspace. This action cannot be undone.",
        onYes: () => {
          showToast(
            new ToastModel({
              title: "Delete requested",
              description: "Profile deletion would be processed once authentication is connected.",
              status: "warning",
            }),
          );
        },
      }),
    );
  };

  return (
    <>
      <Section title="Profile Details">
        <Panel title={profile.name} meta={profile.role}>
          <div className={styles.profileGrid}>
            <div><dt>Name</dt><dd>{profile.name}</dd></div>
            <div><dt>Email</dt><dd>{profile.email}</dd></div>
            <div><dt>Role</dt><dd>{profile.role}</dd></div>
            <div><dt>Workspace</dt><dd>{profile.workspace}</dd></div>
          </div>
        </Panel>
      </Section>

      <Section title="Activity Log">
        <Panel title="Recent activity" meta={`${data.activityLog.length} entries`}>
          <DataTable
            rows={data.activityLog}
            columns={["time", "agent", "action", "input", "output", "duration"]}
          />
        </Panel>
      </Section>

      <Section title="Delete">
        <Panel title="Account removal">
          <p className={ui.muted}>
            Remove your profile and associated activity from this workspace. You will need to sign in again to regain access.
          </p>
          <button className={styles.deleteButton} type="button" onClick={handleDelete}>
            Delete profile
          </button>
        </Panel>
      </Section>
    </>
  );
}
