"use client";

import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PipelineShell } from "./components/pipeline/PipelineShell";
import { Panel } from "./components/ui/Panel";
import data from "./data/dashboard.json";
import type { DatasetItem, Experiment, MainView } from "./types";
import { LiveDatasetPage } from "./views/live/LiveDatasetPage";
import { LiveExperimentPage, mapDataset } from "./views/live/LiveExperimentPage";
import { LiveProfilePage } from "./views/live/LiveProfilePage";

type ApiExperiment = {
  id: string;
  name: string;
  description?: string;
  status: string;
  modifiedDateTime: string;
  datasetIds?: string[];
};

function mapExperiment(value: ApiExperiment): Experiment {
  return {
    id: value.id,
    name: value.name,
    description: value.description,
    status: value.status,
    updatedAt: value.modifiedDateTime,
    dataset: `${value.datasetIds?.length ?? 0} datasets`,
    datasetIds: value.datasetIds ?? [],
  };
}

function Dashboard({ demoMode }: { demoMode: boolean }) {
  const router = useRouter();
  const [mainView, setMainView] = useState<MainView>("experiment");
  const [experiments, setExperiments] = useState<Experiment[]>(
    demoMode ? (data.experiments as Experiment[]) : [],
  );
  const [datasets, setDatasets] = useState<DatasetItem[]>(
    demoMode ? (data.datasets as DatasetItem[]) : [],
  );
  const [selectedExperimentId, setSelectedExperimentId] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(!demoMode);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (demoMode) return;
    const controller = new AbortController();
    Promise.all([
      fetch("/api/core/experiments", { cache: "no-store", signal: controller.signal }),
      fetch("/api/core/datasets", { cache: "no-store", signal: controller.signal }),
    ])
      .then(async ([experimentResponse, datasetResponse]) => {
        if (experimentResponse.status === 401 || datasetResponse.status === 401) {
          router.replace("/pipeline/login");
          return;
        }
        if (!experimentResponse.ok || !datasetResponse.ok) {
          throw new Error("Live experiments and datasets could not be loaded from the core API.");
        }
        const experimentValues = (await experimentResponse.json()) as ApiExperiment[];
        const datasetValues = (await datasetResponse.json()) as Array<Record<string, unknown>>;
        const mappedExperiments = experimentValues.map(mapExperiment);
        const mappedDatasets = datasetValues.map(mapDataset);
        setExperiments(mappedExperiments);
        setDatasets(mappedDatasets);
        setSelectedExperimentId(mappedExperiments[0]?.id ?? "");
        setSelectedDatasetId(mappedDatasets[0]?.id ?? "");
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setLoadError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [demoMode, router]);

  const selectedExperiment = useMemo(
    () => experiments.find((item) => item.id === selectedExperimentId) ?? experiments[0],
    [experiments, selectedExperimentId],
  );
  const selectedDataset = useMemo(
    () => datasets.find((item) => item.id === selectedDatasetId) ?? datasets[0],
    [datasets, selectedDatasetId],
  );

  const handleSignOut = async () => {
    if (demoMode) {
      router.push("/pipeline/login");
      return;
    }
    await signOut({ redirectTo: "/pipeline/login" });
  };

  return (
    <PipelineShell
      experiments={experiments}
      datasets={datasets}
      demoMode={demoMode}
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
      onSignOut={handleSignOut}
    >
      {loading ? <Panel title="Loading live workspace"><p>Reading authenticated records from the core API…</p></Panel> : null}
      {loadError ? <Panel title="Live data unavailable" meta="Error"><p>{loadError}</p></Panel> : null}
      {!loading && !loadError && mainView === "experiment" ? (
        demoMode && selectedExperiment ? (
          <Panel title={selectedExperiment.name} meta="Isolated fixture">
            <p>Preview data only. Sign in to run the hosted Azure pipeline.</p>
          </Panel>
        ) : (
          <LiveExperimentPage
            key={selectedExperiment?.id ?? "new-experiment"}
            experiment={selectedExperiment}
            datasets={datasets}
            onDatasetCreated={(dataset) => {
              setDatasets((current) => [dataset, ...current.filter((item) => item.id !== dataset.id)]);
              setSelectedDatasetId(dataset.id);
            }}
            onExperimentCreated={(experiment) => {
              setExperiments((current) => [experiment, ...current.filter((item) => item.id !== experiment.id)]);
              setSelectedExperimentId(experiment.id);
              setMainView("experiment");
            }}
          />
        )
      ) : null}
      {!loading && !loadError && mainView === "dataset" && selectedDataset ? (
        demoMode ? <Panel title={selectedDataset.name} meta="Isolated fixture"><p>Preview data only.</p></Panel> : <LiveDatasetPage dataset={selectedDataset} />
      ) : null}
      {!loading && !loadError && mainView === "profile" ? (
        demoMode ? <Panel title="Demo profile" meta="Isolated fixture"><p>Preview data only.</p></Panel> : <LiveProfilePage />
      ) : null}
    </PipelineShell>
  );
}

function DashboardMode() {
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("mode") === "demo";
  return <Dashboard key={demoMode ? "demo" : "live"} demoMode={demoMode} />;
}

export default function Home() {
  return (
    <Suspense fallback={<main>Loading dashboard…</main>}>
      <DashboardMode />
    </Suspense>
  );
}
