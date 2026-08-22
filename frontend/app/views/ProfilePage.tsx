"use client";

import data from "../data/dashboard.json";
import { useAppShell } from "../components/providers/AppProviders";
import type { ApiUser } from "../lib/apiTypes";
import { ConfirmModalModel } from "../models/modal";
import { ToastModel } from "../models/toast";
import { DataTable } from "../components/ui/DataTable";
import { Panel } from "../components/ui/Panel";
import { Section } from "../components/ui/Section";
import ui from "../components/ui/Ui.module.css";
import styles from "./ProfilePage.module.css";

export function ProfilePage({ user }: { user: ApiUser }) {
  const { showModal, showToast } = useAppShell();
  const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;

  const handleDelete = () => {
    showModal(
      new ConfirmModalModel({
        title: "Delete profile",
        description:
          "This will permanently remove your profile and activity history from this workspace. This action cannot be undone.",
        onYes: () => {
          showToast(
            new ToastModel({
              title: "Delete requested",
              description: "Profile deletion is not available from the API yet.",
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
        <Panel title={displayName} meta={user.role}>
          <div className={styles.profileGrid}>
            <div>
              <dt>Name</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user.role}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{user.status}</dd>
            </div>
          </div>
        </Panel>
      </Section>

      <Section title="Activity Log">
        <Panel title="Recent activity" meta={`${data.activityLog.length} entries`}>
          <DataTable
            rows={data.activityLog as Array<Record<string, unknown>>}
            columns={["time", "agent", "action", "input", "output", "duration"]}
          />
        </Panel>
      </Section>

      <Section title="Delete">
        <Panel title="Account removal">
          <p className={ui.muted}>
            Remove your profile and associated activity from this workspace. You will need to sign in again to regain
            access.
          </p>
          <button className={styles.deleteButton} type="button" onClick={handleDelete}>
            Delete profile
          </button>
        </Panel>
      </Section>
    </>
  );
}
