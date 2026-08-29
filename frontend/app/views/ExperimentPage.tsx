"use client";

import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MultiOmicsIntegrationPanel } from "../components/multi-omics/MultiOmicsIntegrationPanel";
import { useAppShell } from "../components/providers/AppProviders";
import { PageShell } from "../components/dashboard/PageShell";
import { Panel } from "../components/ui/Panel";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Section } from "../components/ui/Section";
import ui from "../components/ui/Ui.module.css";
import { ToastModel } from "../models/toast";
import type { DatasetItem, Experiment, PatientNode, WorkflowStep } from "../types";
import styles from "./ExperimentPage.module.css";

export function ExperimentPage({
  experiment,
  datasets,
  workflowSteps,
  onWorkflowRefresh,
}: {
  experiment: Experiment;
  datasets: DatasetItem[];
  workflowSteps?: WorkflowStep[];
  onWorkflowRefresh?: () => void;
}) {
  const { showToast } = useAppShell();
  const [selectedDataset, setSelectedDataset] = useState(experiment.dataset);
  const [selectedPatient, setSelectedPatient] = useState<PatientNode | null>(null);

  const patients = useMemo<PatientNode[]>(
    () => [
      { id: "CPTAC-0042", cohort: "BRCA", trainingWeight: 0.94, risk: "Low", focus: "ERBB2 / PIK3CA" },
      { id: "CPTAC-0081", cohort: "LUAD", trainingWeight: 0.91, risk: "Medium", focus: "ALK / MET" },
      { id: "CPTAC-0024", cohort: "COAD", trainingWeight: 0.87, risk: "High", focus: "KRAS / APC" },
      { id: "CPTAC-0116", cohort: "GBM", trainingWeight: 0.95, risk: "Critical", focus: "EGFR / PTEN" },
      { id: "CPTAC-0058", cohort: "OV", trainingWeight: 0.88, risk: "High", focus: "BRCA1 / MYC" },
    ],
    [],
  );

  const patientClass = `${styles.flowNode} ${styles.patientNode}`;
  const nodes: Node[] = useMemo(
    () => [
      {
        id: patients[0].id,
        position: { x: 280, y: 20 },
        data: { label: patients[0].id, patient: patients[0] },
        type: "input",
        className: patientClass,
      },
      { id: patients[1].id, position: { x: 80, y: 140 }, data: { label: patients[1].id, patient: patients[1] }, className: patientClass },
      { id: patients[2].id, position: { x: 280, y: 140 }, data: { label: patients[2].id, patient: patients[2] }, className: patientClass },
      { id: patients[3].id, position: { x: 480, y: 140 }, data: { label: patients[3].id, patient: patients[3] }, className: patientClass },
      {
        id: patients[4].id,
        position: { x: 280, y: 280 },
        data: { label: patients[4].id, patient: patients[4] },
        type: "output",
        className: patientClass,
      },
    ],
    [patientClass, patients],
  );

  const edges: Edge[] = useMemo(
    () => [
      { id: "e1", source: patients[0].id, target: patients[1].id, animated: true },
      { id: "e2", source: patients[0].id, target: patients[2].id },
      { id: "e3", source: patients[0].id, target: patients[3].id, animated: true },
      { id: "e4", source: patients[1].id, target: patients[4].id },
      { id: "e5", source: patients[2].id, target: patients[4].id, animated: true },
      { id: "e6", source: patients[3].id, target: patients[4].id },
    ],
    [patients],
  );

  const steps =
    workflowSteps ??
    ([
      {
        id: "preprocessing",
        label: "Pre-processing",
        status: "Pending",
        detail: "Waiting for pipeline status from the API.",
      },
    ] as WorkflowStep[]);

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
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Patients</p>
          <p className={ui.metricValue}>{patients.length}</p>
        </div>
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Workflow steps</p>
          <p className={ui.metricValue}>{steps.length}</p>
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

      <Section title="Digital Twin">
        <div className={styles.twinLayout}>
          <div className={styles.flowCanvas}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              fitViewOptions={{ padding: 0.16 }}
              nodesDraggable={false}
              nodesConnectable={false}
              panOnScroll
              onNodeClick={(_, node) => setSelectedPatient(node.data.patient as PatientNode)}
            >
              <Background color="#4b637b" gap={20} />
              <MiniMap pannable zoomable nodeStrokeWidth={3} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
          <aside className={styles.twinAside}>
            <Panel title="Selected twin">
              {selectedPatient ? (
                <div className={styles.detailList}>
                  <div>
                    <dt>Patient</dt>
                    <dd>{selectedPatient.id}</dd>
                  </div>
                  <div>
                    <dt>Cohort</dt>
                    <dd>{selectedPatient.cohort}</dd>
                  </div>
                  <div>
                    <dt>Training weight</dt>
                    <dd>{Math.round(selectedPatient.trainingWeight * 100)}%</dd>
                  </div>
                  <div>
                    <dt>Risk signal</dt>
                    <dd>{selectedPatient.risk}</dd>
                  </div>
                  <div>
                    <dt>Focus</dt>
                    <dd>{selectedPatient.focus}</dd>
                  </div>
                </div>
              ) : (
                <p className={ui.muted}>Select a node in the digital twin graph to inspect training details.</p>
              )}
            </Panel>
          </aside>
        </div>
      </Section>

      <Section title="Workflow">
        <div className={`${ui.grid} ${ui.two}`}>
          {steps.map((step) => (
            <Panel key={step.id} title={step.label} meta={step.status}>
              <p className={ui.muted}>{step.detail}</p>
              <ProgressBar
                value={
                  step.status === "Complete" ? 100 : step.status === "Running" ? 62 : step.status === "Review" ? 48 : 18
                }
              />
            </Panel>
          ))}
        </div>
      </Section>

      <MultiOmicsIntegrationPanel
        experimentId={experiment.id}
        datasets={datasets}
        onWorkflowRefresh={() => onWorkflowRefresh?.()}
      />
    </PageShell>
  );
}
