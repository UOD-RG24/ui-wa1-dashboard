"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGate } from "./components/auth/AuthGate";
import { DashboardShell } from "./components/dashboard/DashboardShell";
import { useAppShell } from "./components/providers/AppProviders";
import {
  createDataset,
  createExperiment,
  deleteDataset,
  downloadDataset,
  listDatasets,
  listExperiments,
  signOut,
  updateDataset,
} from "./lib/api";
import { ApiError } from "./lib/apiClient";
import type { ApiDataset, ApiExperiment, ApiUser } from "./lib/apiTypes";
import { clearAuthSession } from "./lib/authStorage";
import { mapDataset, mapExperiment } from "./lib/mappers";
import { InputModalModel } from "./models/modal";
import { ToastModel } from "./models/toast";
import type { DatasetItem, Experiment, MainView } from "./types";
import { DatasetsPage } from "./views/DatasetsPage";
import { ExperimentPage } from "./views/ExperimentPage";
import { ProfilePage } from "./views/ProfilePage";
import { TwinsPage } from "./views/TwinsPage";

function sortExperiments(items: Experiment[]) {
  return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function sortDatasets(items: DatasetItem[]) {
  return [...items].sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
}

function DashboardHome({ user }: { user: ApiUser }) {
  const router = useRouter();
  const { showToast, showModal } = useAppShell();
  const [mainView, setMainView] = useState<MainView>("experiment");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [apiDatasets, setApiDatasets] = useState<ApiDataset[]>([]);
  const [apiExperiments, setApiExperiments] = useState<ApiExperiment[]>([]);
  const [selectedExperimentId, setSelectedExperimentId] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");

  const datasets = useMemo(() => sortDatasets(apiDatasets.map(mapDataset)), [apiDatasets]);
  const experiments = useMemo(() => sortExperiments(apiExperiments.map(mapExperiment)), [apiExperiments]);

  const selectedExperiment = useMemo(
    () => experiments.find((item) => item.id === selectedExperimentId) ?? experiments[0],
    [experiments, selectedExperimentId],
  );
  const selectedDataset = useMemo(
    () => datasets.find((item) => item.id === selectedDatasetId) ?? datasets[0],
    [datasets, selectedDatasetId],
  );
  const selectedApiDataset = useMemo(
    () => apiDatasets.find((item) => item.id === selectedDatasetId) ?? apiDatasets[0],
    [apiDatasets, selectedDatasetId],
  );

  const refreshLists = useCallback(async () => {
    const [datasetRows, experimentRows] = await Promise.all([listDatasets(), listExperiments()]);
    setApiDatasets(datasetRows);
    setApiExperiments(experimentRows);
    setSelectedDatasetId((current) =>
      current && datasetRows.some((item) => item.id === current) ? current : datasetRows[0]?.id ?? "",
    );
    setSelectedExperimentId((current) =>
      current && experimentRows.some((item) => item.id === current) ? current : experimentRows[0]?.id ?? "",
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await refreshLists();
      } catch (error) {
        if (!cancelled) {
          showToast(
            new ToastModel({
              title: "Could not load workspace",
              description: error instanceof ApiError ? error.message : "Failed to load datasets and experiments.",
              status: "error",
            }),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshLists, showToast]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // ignore
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

  const handleCreateExperiment = () => {
    showModal(
      new InputModalModel({
        title: "Create experiment",
        description: "Enter a name for the new experiment.",
        label: "Experiment name",
        defaultValue: "New experiment",
        onOk: (value) => {
          void (async () => {
            try {
              const created = await createExperiment({ name: value.trim() || "New experiment" });
              await refreshLists();
              setSelectedExperimentId(created.id);
              setMainView("experiment");
              showToast(
                new ToastModel({
                  title: "Experiment created",
                  description: created.name,
                  status: "success",
                }),
              );
            } catch (error) {
              showToast(
                new ToastModel({
                  title: "Create failed",
                  description: error instanceof ApiError ? error.message : "Could not create experiment.",
                  status: "error",
                }),
              );
            }
          })();
        },
      }),
    );
  };

  const handleCreateDataset = () => {
    showModal(
      new InputModalModel({
        title: "Upload dataset",
        description: "Choose a CSV/TSV file, then provide a name and omics type.",
        label: "Dataset name",
        defaultValue: "New dataset",
        onOk: (name) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".csv,.tsv,.txt";
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            void (async () => {
              try {
                const form = new FormData();
                form.append("Name", name.trim() || file.name);
                form.append("Description", "");
                form.append("OmicsType", "transcriptomics");
                form.append("File", file);
                const created = await createDataset(form);
                await refreshLists();
                setSelectedDatasetId(created.id);
                setMainView("dataset");
                showToast(
                  new ToastModel({
                    title: "Dataset uploaded",
                    description: created.name,
                    status: "success",
                  }),
                );
              } catch (error) {
                showToast(
                  new ToastModel({
                    title: "Upload failed",
                    description: error instanceof ApiError ? error.message : "Could not upload dataset.",
                    status: "error",
                  }),
                );
              }
            })();
          };
          input.click();
        },
      }),
    );
  };

  const handleUpdateDataset = () => {
    if (!selectedApiDataset) return;
    showModal(
      new InputModalModel({
        title: "Rename dataset",
        description: "Update the dataset display name.",
        label: "Name",
        defaultValue: selectedApiDataset.name,
        onOk: (value) => {
          void (async () => {
            try {
              await updateDataset(selectedApiDataset.id, { name: value.trim() || selectedApiDataset.name });
              await refreshLists();
              showToast(new ToastModel({ title: "Dataset updated", description: value, status: "success" }));
            } catch (error) {
              showToast(
                new ToastModel({
                  title: "Update failed",
                  description: error instanceof ApiError ? error.message : "Could not update dataset.",
                  status: "error",
                }),
              );
            }
          })();
        },
      }),
    );
  };

  const handleDownloadDataset = async () => {
    if (!selectedApiDataset) return;
    try {
      const blob = await downloadDataset(selectedApiDataset.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = selectedApiDataset.originalFileName || `${selectedApiDataset.name}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(
        new ToastModel({
          title: "Download failed",
          description: error instanceof ApiError ? error.message : "Could not download dataset.",
          status: "error",
        }),
      );
    }
  };

  const handleDeleteDataset = () => {
    if (!selectedApiDataset) return;
    showModal(
      new InputModalModel({
        title: "Delete dataset",
        description: `Type DELETE to remove "${selectedApiDataset.name}".`,
        label: "Confirmation",
        defaultValue: "",
        onOk: (value) => {
          if (value.trim().toUpperCase() !== "DELETE") {
            showToast(
              new ToastModel({
                title: "Delete cancelled",
                description: "You must type DELETE to confirm.",
                status: "warning",
              }),
            );
            return;
          }
          void (async () => {
            try {
              await deleteDataset(selectedApiDataset.id);
              await refreshLists();
              setMainView("dataset");
              showToast(
                new ToastModel({
                  title: "Dataset deleted",
                  description: selectedApiDataset.name,
                  status: "success",
                }),
              );
            } catch (error) {
              showToast(
                new ToastModel({
                  title: "Delete failed",
                  description: error instanceof ApiError ? error.message : "Could not delete dataset.",
                  status: "error",
                }),
              );
            }
          })();
        },
      }),
    );
  };

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <p>Loading workspace…</p>
      </main>
    );
  }

  return (
    <DashboardShell
      mainView={mainView}
      experiments={experiments}
      datasets={datasets}
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
      onSelectTwins={() => setMainView("twins")}
      onSignOut={() => {
        void handleSignOut();
      }}
      onCreateExperiment={handleCreateExperiment}
      onCreateDataset={handleCreateDataset}
      userName={`${user.firstName} ${user.lastName}`.trim() || user.email}
    >
      {mainView === "experiment" && selectedExperiment ? (
        <ExperimentPage
          experiment={selectedExperiment}
          datasets={datasets}
          onWorkflowRefresh={() => void refreshLists()}
        />
      ) : null}
      {mainView === "dataset" && selectedDataset ? (
        <DatasetsPage
          dataset={selectedDataset}
          onRename={handleUpdateDataset}
          onDownload={() => {
            void handleDownloadDataset();
          }}
          onDelete={handleDeleteDataset}
        />
      ) : null}
      {mainView === "profile" ? <ProfilePage user={user} /> : null}
      {mainView === "twins" && selectedExperiment ? <TwinsPage experiment={selectedExperiment} /> : null}
    </DashboardShell>
  );
}

export default function Home() {
  return <AuthGate>{(user) => <DashboardHome user={user} />}</AuthGate>;
}
