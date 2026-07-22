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
import type { PatientNode } from "../types";
import { Panel } from "../components/ui/Panel";
import { Section } from "../components/ui/Section";
import { Toolbar } from "../components/ui/Toolbar";
import ui from "../components/ui/Ui.module.css";
import styles from "./ClusterPage.module.css";

export function ClusterPage() {
  const [selectedPatient, setSelectedPatient] = useState<PatientNode | null>(null);

  const patients = useMemo<PatientNode[]>(
    () => [
      { id: "CPTAC-0042", cohort: "BRCA", trainingWeight: 0.94, risk: "Low", focus: "ERBB2 / PIK3CA" },
      { id: "CPTAC-0081", cohort: "LUAD", trainingWeight: 0.91, risk: "Medium", focus: "ALK / MET" },
      { id: "CPTAC-0024", cohort: "COAD", trainingWeight: 0.87, risk: "High", focus: "KRAS / APC" },
      { id: "CPTAC-0116", cohort: "GBM", trainingWeight: 0.95, risk: "Critical", focus: "EGFR / PTEN" },
      { id: "CPTAC-0058", cohort: "OV", trainingWeight: 0.88, risk: "High", focus: "BRCA1 / MYC" },
      { id: "CPTAC-0094", cohort: "BRCA", trainingWeight: 0.92, risk: "Medium", focus: "TP53 / MDM2" },
      { id: "CPTAC-0137", cohort: "BRCA", trainingWeight: 0.9, risk: "Low", focus: "ESR1 / FOXA1" },
      { id: "CPTAC-0172", cohort: "LUAD", trainingWeight: 0.86, risk: "High", focus: "KRAS / STK11" },
      { id: "CPTAC-0210", cohort: "COAD", trainingWeight: 0.89, risk: "Medium", focus: "APC / CTNNB1" },
    ],
    [],
  );

  const patientClass = `${styles.flowNode} ${styles.patientNode}`;
  const nodes: Node[] = useMemo(
    () => [
      { id: patients[0].id, position: { x: 345, y: 20 }, data: { label: patients[0].id, patient: patients[0] }, type: "input", className: patientClass },
      { id: patients[1].id, position: { x: 95, y: 145 }, data: { label: patients[1].id, patient: patients[1] }, className: patientClass },
      { id: patients[2].id, position: { x: 365, y: 145 }, data: { label: patients[2].id, patient: patients[2] }, className: patientClass },
      { id: patients[3].id, position: { x: 635, y: 145 }, data: { label: patients[3].id, patient: patients[3] }, className: patientClass },
      { id: patients[4].id, position: { x: 95, y: 330 }, data: { label: patients[4].id, patient: patients[4] }, className: patientClass },
      { id: patients[5].id, position: { x: 365, y: 330 }, data: { label: patients[5].id, patient: patients[5] }, className: patientClass },
      { id: patients[6].id, position: { x: 635, y: 330 }, data: { label: patients[6].id, patient: patients[6] }, className: patientClass },
      { id: patients[7].id, position: { x: 220, y: 515 }, data: { label: patients[7].id, patient: patients[7] }, className: patientClass },
      { id: patients[8].id, position: { x: 505, y: 515 }, data: { label: patients[8].id, patient: patients[8] }, type: "output", className: patientClass },
    ],
    [patientClass, patients],
  );

  const edges: Edge[] = useMemo(
    () => [
      { id: "e1", source: patients[0].id, target: patients[1].id, animated: true },
      { id: "e2", source: patients[0].id, target: patients[2].id },
      { id: "e3", source: patients[0].id, target: patients[3].id, animated: true },
      { id: "e4", source: patients[1].id, target: patients[2].id },
      { id: "e5", source: patients[2].id, target: patients[3].id },
      { id: "e6", source: patients[1].id, target: patients[4].id },
      { id: "e7", source: patients[2].id, target: patients[4].id, animated: true },
      { id: "e8", source: patients[2].id, target: patients[5].id },
      { id: "e9", source: patients[3].id, target: patients[6].id, animated: true },
      { id: "e10", source: patients[4].id, target: patients[5].id },
      { id: "e11", source: patients[5].id, target: patients[6].id },
      { id: "e12", source: patients[4].id, target: patients[7].id },
      { id: "e13", source: patients[5].id, target: patients[7].id, animated: true },
      { id: "e14", source: patients[5].id, target: patients[8].id, animated: true },
      { id: "e15", source: patients[6].id, target: patients[8].id },
      { id: "e16", source: patients[7].id, target: patients[8].id },
      { id: "e17", source: patients[1].id, target: patients[5].id },
      { id: "e18", source: patients[3].id, target: patients[5].id },
      { id: "e19", source: patients[6].id, target: patients[7].id },
    ],
    [patients],
  );

  return (
    <>
      <Toolbar />
      <div className={styles.contentSplit}>
        <div>
          <Section title="Patient twin graph">
            <div className={styles.flowCanvas}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                fitViewOptions={{ padding: 0.14 }}
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
          </Section>
        </div>
        <aside className={styles.sidePanel}>
          <Section title="Selected twin">
            {selectedPatient ? (
              <div className={styles.detailList}>
                <div><dt>Patient</dt><dd>{selectedPatient.id}</dd></div>
                <div><dt>Cohort</dt><dd>{selectedPatient.cohort}</dd></div>
                <div><dt>Training weight</dt><dd>{Math.round(selectedPatient.trainingWeight * 100)}%</dd></div>
                <div><dt>Risk signal</dt><dd>{selectedPatient.risk}</dd></div>
                <div><dt>Focus</dt><dd>{selectedPatient.focus}</dd></div>
              </div>
            ) : (
              <p className={ui.muted}>Select a patient node to inspect its training weight and model focus.</p>
            )}
          </Section>
          <Section title="Weight guide">
            <div className={styles.healthRow}>
              <span><span className={`${styles.statusDot} ${styles.good}`} />High confidence</span>
              <span><span className={`${styles.statusDot} ${styles.warn}`} />Medium</span>
              <span><span className={`${styles.statusDot} ${styles.hot}`} />Priority</span>
            </div>
          </Section>
          <Section title="Simulation draft">
            <Panel title="Intervention focus" meta="Ready">
              <p className={ui.muted}>Route the selected patient through a lightweight simulation scenario.</p>
              <label>
                Target
                <select defaultValue="ERBB2">
                  <option>ERBB2</option>
                  <option>PIK3CA</option>
                  <option>BRCA1</option>
                </select>
              </label>
              <button className={ui.primaryAction}>Run preview</button>
            </Panel>
          </Section>
        </aside>
      </div>
    </>
  );
}
