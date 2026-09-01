"use client";

import { useState } from "react";
import { MultiOmicsIntegrationPanel } from "../components/multi-omics/MultiOmicsIntegrationPanel";
import { useAppShell } from "../components/providers/AppProviders";
import { PageShell } from "../components/dashboard/PageShell";
import { Panel } from "../components/ui/Panel";
import { Section } from "../components/ui/Section";
import ui from "../components/ui/Ui.module.css";
import { ToastModel } from "../models/toast";
import type { DatasetItem, Experiment } from "../types";
import styles from "./ExperimentPage.module.css";

export function ExperimentPage({
  experiment,
  datasets,
  onWorkflowRefresh,
}: {
  experiment: Experiment;
  datasets: DatasetItem[];
  onWorkflowRefresh?: () => void;
}) {
  const { showToast } = useAppShell();
  const [selectedDataset, setSelectedDataset] = useState(experiment.dataset);

  const handleDatasetChange = (value: string) => {
    setSelectedDataset(value);
    showToast(
      new ToastModel({
        title: "Dataset selection updated locally",
        description: `UI link set to ${value}. Experiment↔dataset linking is not in the API yet.`,
        status: "info",
      }),
    );
  };

  return (
    <PageShell category="Experiment" title={experiment.name}>
      <div className={ui.metricStrip}>
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Status</p>
          <p className={ui.metricValue} style={{ fontSize: "calc(20px * var(--ui-scale))" }}>
            {experiment.status}
          </p>
        </div>
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Linked dataset</p>
          <p className={ui.metricValue} style={{ fontSize: "calc(18px * var(--ui-scale))" }}>
            {selectedDataset || "—"}
          </p>
        </div>
      </div>

      <Section title="Dataset Selection">
        <Panel title={experiment.name} meta={experiment.status}>
          <div className={styles.selectionRow}>
            <label>
              Linked dataset
              <select value={selectedDataset} onChange={(event) => handleDatasetChange(event.target.value)}>
                {datasets.length === 0 ? <option value="">No datasets uploaded</option> : null}
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.name}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.metaGrid}>
              <span>
                <b>Experiment ID</b>
                {experiment.id}
              </span>
              <span>
                <b>Last updated</b>
                {new Date(experiment.updatedAt).toLocaleString()}
              </span>
              <span>
                <b>Status</b>
                {experiment.status}
              </span>
            </div>
          </div>
        </Panel>
      </Section>

      <MultiOmicsIntegrationPanel
        experimentId={experiment.id}
        datasets={datasets}
        onWorkflowRefresh={() => onWorkflowRefresh?.()}
      />
    </PageShell>
  );
}
