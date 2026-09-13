"use client";

import { DigitalTwinsPanel } from "../components/digital-twins/DigitalTwinsPanel";
import { PageShell } from "../components/dashboard/PageShell";
import ui from "../components/ui/Ui.module.css";
import type { DatasetItem, Experiment } from "../types";

export function TwinsPage({
  experiment,
  datasets,
  onWorkflowRefresh,
}: {
  experiment: Experiment;
  datasets: DatasetItem[];
  onWorkflowRefresh?: () => void;
}) {
  return (
    <PageShell category="Digital Twin" title={experiment.name}>
      <div className={ui.metricStrip}>
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Experiment</p>
          <p className={ui.metricValue} style={{ fontSize: "calc(18px * var(--ui-scale))" }}>
            {experiment.name}
          </p>
        </div>
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Status</p>
          <p className={ui.metricValue} style={{ fontSize: "calc(20px * var(--ui-scale))" }}>
            {experiment.status}
          </p>
        </div>
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Experiment blobs</p>
          <p className={ui.metricValue}>{experiment.blobIds?.length ?? 0}</p>
        </div>
      </div>
      <DigitalTwinsPanel
        experimentId={experiment.id}
        datasets={datasets}
        onWorkflowRefresh={() => onWorkflowRefresh?.()}
      />
    </PageShell>
  );
}
