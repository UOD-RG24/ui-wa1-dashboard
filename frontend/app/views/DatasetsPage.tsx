"use client";

import { useRef } from "react";
import data from "../data/dashboard.json";
import { useAppShell } from "../components/providers/AppProviders";
import { InputModalModel } from "../models/modal";
import { ToastModel } from "../models/toast";
import { PageShell } from "../components/dashboard/PageShell";
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

  return (
    <Section title={layer.label}>
      <div className={styles.layerGrid}>
        <Panel title="Preview matrix" meta="Mock preview">
          <p className={ui.muted}>
            Layer previews remain illustrative until matrix-read APIs are available. Dataset file ops use the actions
            above.
          </p>
          <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt,.xlsx" hidden />
          <button
            className={ui.primaryAction}
            type="button"
            onClick={() => {
              showToast(
                new ToastModel({
                  title: "Preview only",
                  description: `Use Upload dataset in the sidebar to create API-backed ${layer.label} files.`,
                  status: "info",
                }),
              );
            }}
          >
            Preview hint
          </button>
        </Panel>

        <Panel title="Matrix Information" meta={layer.matrix.format}>
          <div className={styles.matrixInfo}>
            <span>
              <b>Rows</b>
              {layer.matrix.rows.toLocaleString()}
            </span>
            <span>
              <b>Columns</b>
              {layer.matrix.columns.toLocaleString()}
            </span>
            <span>
              <b>Missing</b>
              {layer.matrix.missing}
            </span>
            <span>
              <b>Format</b>
              {layer.matrix.format}
            </span>
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
          <button
            className={`${ui.button} ${styles.visualiseButton}`}
            type="button"
            onClick={() => {
              showModal(
                new InputModalModel({
                  title: `${layer.label} visualisation`,
                  description: "Choose a chart title for a future visualisation request.",
                  label: "Chart title",
                  defaultValue: `${layer.label} heatmap preview`,
                  onOk: (value) => {
                    showToast(
                      new ToastModel({
                        title: "Visualisation queued",
                        description: `"${value}" is not connected to an API yet.`,
                        status: "info",
                      }),
                    );
                  },
                }),
              );
            }}
          >
            Generate visualisation
          </button>
        </Panel>
      </div>
    </Section>
  );
}

export function DatasetsPage({
  dataset,
  onRename,
  onDownload,
  onDelete,
}: {
  dataset: DatasetItem;
  onRename?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}) {
  const omicsLayers = data.omicsLayers as Record<OmicsLayerKey, OmicsLayer>;

  return (
    <PageShell
      category="Dataset"
      title={dataset.name}
      actions={
        <>
          {onRename ? (
            <button className={ui.button} type="button" onClick={onRename}>
              Rename
            </button>
          ) : null}
          {onDownload ? (
            <button className={ui.button} type="button" onClick={onDownload}>
              Download
            </button>
          ) : null}
          {onDelete ? (
            <button className={ui.button} type="button" onClick={onDelete}>
              Delete
            </button>
          ) : null}
        </>
      }
    >
      <div className={ui.metricStrip}>
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Samples</p>
          <p className={ui.metricValue}>{dataset.samples.toLocaleString()}</p>
        </div>
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Features</p>
          <p className={ui.metricValue}>{dataset.features.toLocaleString()}</p>
        </div>
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Quality</p>
          <p className={ui.metricValue}>{dataset.quality}%</p>
        </div>
        <div className={ui.metricCell}>
          <p className={ui.metricLabel}>Updated</p>
          <p className={ui.metricValue} style={{ fontSize: "calc(18px * var(--ui-scale))" }}>
            {dataset.updated}
          </p>
          <p className={ui.metricDetail}>{dataset.type}</p>
        </div>
      </div>

      {layerKeys.map((layerKey) => (
        <OmicsLayerSection key={layerKey} layerKey={layerKey} layer={omicsLayers[layerKey]} />
      ))}
    </PageShell>
  );
}
