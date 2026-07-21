"use client";

import { useRef } from "react";
import data from "../data/dashboard.json";
import { useAppShell } from "../components/providers/AppProviders";
import { InputModalModel } from "../models/modal";
import { ToastModel } from "../models/toast";
import { MiniHeatmap } from "../components/ui/MiniHeatmap";
import { Panel } from "../components/ui/Panel";
import { Section } from "../components/ui/Section";
import { SortableDataTable } from "../components/ui/SortableDataTable";
import ui from "../components/ui/Ui.module.css";
import type { DatasetItem, OmicsLayerKey } from "../types";
import styles from "./DatasetsPage.module.css";

type OmicsLayer = {
  label: string;
  matrix: {
    rows: number;
    columns: number;
    missing: string;
    format: string;
  };
  rows: Array<{
    feature: string;
    sampleA: number;
    sampleB: number;
    sampleC: number;
    cohort: string;
  }>;
};

const layerKeys: OmicsLayerKey[] = ["dnaMethylation", "transcriptomics", "proteomics"];

const heatmapVariant: Record<OmicsLayerKey, "rna" | "protein"> = {
  dnaMethylation: "rna",
  transcriptomics: "rna",
  proteomics: "protein",
};

function OmicsLayerSection({ layerKey, layer }: { layerKey: OmicsLayerKey; layer: OmicsLayer }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showModal, showToast } = useAppShell();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    showToast(
      new ToastModel({
        title: "Upload received",
        description: `${file.name} queued for ${layer.label} matrix validation.`,
        status: "success",
      }),
    );
    event.target.value = "";
  };

  const handleVisualise = () => {
    showModal(
      new InputModalModel({
        title: `${layer.label} visualisation`,
        description: "Choose a chart title for the generated visualisation request.",
        label: "Chart title",
        defaultValue: `${layer.label} heatmap preview`,
        onOk: (value) => {
          showToast(
            new ToastModel({
              title: "Visualisation queued",
              description: `"${value}" will be sent to the visualisation API when connected.`,
              status: "info",
            }),
          );
        },
      }),
    );
  };

  return (
    <Section title={layer.label}>
      <div className={styles.layerGrid}>
        <Panel title="Upload" meta="Matrix file">
          <p className={ui.muted}>Upload a matrix file for {layer.label.toLowerCase()} analysis.</p>
          <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.xlsx" hidden onChange={handleFileSelected} />
          <button className={ui.primaryAction} type="button" onClick={handleUploadClick}>
            Upload matrix
          </button>
        </Panel>

        <Panel title="Matrix Information" meta={layer.matrix.format}>
          <div className={styles.matrixInfo}>
            <span><b>Rows</b>{layer.matrix.rows.toLocaleString()}</span>
            <span><b>Columns</b>{layer.matrix.columns.toLocaleString()}</span>
            <span><b>Missing</b>{layer.matrix.missing}</span>
            <span><b>Format</b>{layer.matrix.format}</span>
          </div>
        </Panel>

        <Panel title="Table (Sort)" meta={`${layer.rows.length} preview rows`}>
          <SortableDataTable
            rows={layer.rows}
            columns={[
              { key: "feature", label: "Feature" },
              { key: "sampleA", label: "Sample A" },
              { key: "sampleB", label: "Sample B" },
              { key: "sampleC", label: "Sample C" },
              { key: "cohort", label: "Cohort" },
            ]}
          />
        </Panel>

        <Panel title="Visualisation" meta="Preview">
          <MiniHeatmap variant={heatmapVariant[layerKey]} />
          <button className={`${ui.button} ${styles.visualiseButton}`} type="button" onClick={handleVisualise}>
            Generate visualisation
          </button>
        </Panel>
      </div>
    </Section>
  );
}

export function DatasetsPage({ dataset }: { dataset: DatasetItem }) {
  const omicsLayers = data.omicsLayers as Record<OmicsLayerKey, OmicsLayer>;

  return (
    <>
      <Section title="Selected dataset">
        <Panel title={dataset.name} meta={dataset.type}>
          <div className={styles.datasetStats}>
            <span><b>{dataset.samples.toLocaleString()}</b>samples</span>
            <span><b>{dataset.features.toLocaleString()}</b>features</span>
            <span><b>{dataset.quality}%</b>quality</span>
            <span><b>{dataset.updated}</b>updated</span>
          </div>
        </Panel>
      </Section>

      {layerKeys.map((layerKey) => (
        <OmicsLayerSection key={layerKey} layerKey={layerKey} layer={omicsLayers[layerKey]} />
      ))}
    </>
  );
}
