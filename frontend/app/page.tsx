"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthGate } from "./components/auth/AuthGate";
import { DashboardShell, datasets, experiments } from "./components/dashboard/DashboardShell";
import { useAppShell } from "./components/providers/AppProviders";
import { signOut } from "./lib/api";
import type { ApiUser } from "./lib/apiTypes";
import { clearAuthSession } from "./lib/authStorage";
import { ToastModel } from "./models/toast";
import type { MainView } from "./types";
import { DatasetsPage } from "./views/DatasetsPage";
import { ExperimentPage } from "./views/ExperimentPage";
import { ProfilePage } from "./views/ProfilePage";

function DashboardHome({ user }: { user: ApiUser }) {
  const router = useRouter();
  const { showToast } = useAppShell();
  const [mainView, setMainView] = useState<MainView>("experiment");
  const [selectedExperimentId, setSelectedExperimentId] = useState(experiments[0]?.id ?? "");
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasets[0]?.id ?? "");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedExperiment = useMemo(
    () => experiments.find((item) => item.id === selectedExperimentId) ?? experiments[0],
    [selectedExperimentId],
  );

  const selectedDataset = useMemo(
    () => datasets.find((item) => item.id === selectedDatasetId) ?? datasets[0],
    [selectedDatasetId],
  );

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Always clear local session.
    } finally {
      clearAuthSession();
      showToast(
        new ToastModel({
          title: "Signed out",
          description: "You have been redirected to the sign-in page.",
          status: "info",
        }),
      );
      router.replace("/login");
    }
  };

  return (
    <DashboardShell
      mainView={mainView}
      selectedExperimentId={selectedExperimentId}
      selectedDatasetId={selectedDatasetId}
      isCollapsed={isCollapsed}
      onToggleCollapsed={() => setIsCollapsed((value) => !value)}
      onSelectExperiment={(id) => {
        setSelectedExperimentId(id);
        setMainView("experiment");
      }}
      onSelectDataset={(id) => {
        setSelectedDatasetId(id);
        setMainView("dataset");
      }}
      onSelectProfile={() => setMainView("profile")}
      onSignOut={() => {
        void handleSignOut();
      }}
    >
      {mainView === "experiment" && selectedExperiment ? <ExperimentPage experiment={selectedExperiment} /> : null}
      {mainView === "dataset" && selectedDataset ? <DatasetsPage dataset={selectedDataset} /> : null}
      {mainView === "profile" ? <ProfilePage user={user} /> : null}
    </DashboardShell>
  );
}

export default function Home() {
  return <AuthGate>{(user) => <DashboardHome user={user} />}</AuthGate>;
}
