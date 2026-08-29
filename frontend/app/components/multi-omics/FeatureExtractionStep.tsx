"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import {
  generateFeatureExtraction,
  getFeatureExtraction,
} from "../../lib/multiOmicsApi";
import type { Blob, FeatureExtractionItem } from "../../lib/multiOmicsTypes";
import { syncMultiOmicsSection } from "../../lib/multiOmicsSectionSync";
import { BlobSelect } from "./BlobSelect";
import { FeatureColumnDoughnutChart } from "./charts/RgccaHealthDoughnutChart";
import { ProcessingStepsBarChart } from "./charts/ProcessingStepsBarChart";
import { FeatureNamesTable } from "./FeatureNamesTable";
import styles from "./MultiOmics.module.css";
import ui from "../ui/Ui.module.css";

export function FeatureExtractionStep({
  experimentId,
  datasetId,
  blobs,
  onComplete,
  onFeaturesLoaded,
  onError,
  onWorkflowRefresh,
}: {
  experimentId: string;
  datasetId: string;
  blobs: Blob[];
  onComplete: () => void;
  onFeaturesLoaded?: (names: string[]) => void;
  onError: (message: string) => void;
  onWorkflowRefresh: () => void;
}) {
  const [items, setItems] = useState<FeatureExtractionItem[]>([]);
  const [blobId, setBlobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFeatureExtraction(experimentId);
      setItems(result);
      setLoadedAt(new Date().toLocaleString());
      if (result.length > 0) onComplete();
      const names = result[result.length - 1]?.designMatrixFeatureExtraction?.featureNames ?? [];
      if (names.length > 0) onFeaturesLoaded?.(names);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not load feature extraction results.");
    } finally {
      setLoading(false);
    }
  }, [experimentId, onComplete, onError, onFeaturesLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = items[items.length - 1]?.designMatrixFeatureExtraction;

  const handleGenerate = async () => {
    if (!datasetId || !blobId) {
      onError("Select a dataset and preprocessed matrix blob.");
      return;
    }
    setGenerating(true);
    const started = Date.now();
    try {
      await syncMultiOmicsSection(experimentId, "Running");
      onWorkflowRefresh();
      await generateFeatureExtraction(experimentId, {
        datasetId,
        preprocessedMatrixBlobId: blobId,
      });
      await syncMultiOmicsSection(experimentId, "Complete", {
        processingTimeMs: Date.now() - started,
      });
      onWorkflowRefresh();
      await load();
    } catch (err) {
      await syncMultiOmicsSection(experimentId, "Failed", {
        notes: err instanceof ApiError ? err.message : "Generate failed",
      }).catch(() => undefined);
      onWorkflowRefresh();
      onError(err instanceof ApiError ? err.message : "Feature extraction failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.formGrid}>
        <BlobSelect blobs={blobs} value={blobId} onChange={setBlobId} label="Preprocessed matrix blob" />
      </div>
      <button type="button" className={styles.primaryBtn} onClick={() => void handleGenerate()} disabled={generating}>
        {generating ? <span className={styles.spinner} /> : null}
        Generate feature extraction
      </button>

      {loading ? <p className={styles.dropzoneHint}>Loading cached results…</p> : null}
      {loadedAt ? <p className={styles.timestamp}>Cached at: {loadedAt}</p> : null}

      {latest ? (
        <>
          <div className={ui.metricStrip}>
            <div className={ui.metricCell}>
              <p className={ui.metricLabel}>Features</p>
              <p className={ui.metricValue}>{latest.featureCount ?? "—"}</p>
            </div>
            <div className={ui.metricCell}>
              <p className={ui.metricLabel}>Excluded columns</p>
              <p className={ui.metricValue}>{latest.excludedColumnCount ?? "—"}</p>
            </div>
            <div className={ui.metricCell}>
              <p className={ui.metricLabel}>Total columns</p>
              <p className={ui.metricValue}>{latest.totalColumnCount ?? "—"}</p>
            </div>
          </div>
          <FeatureColumnDoughnutChart
            featureCount={latest.featureCount}
            excludedColumnCount={latest.excludedColumnCount}
            totalColumnCount={latest.totalColumnCount}
          />
          <ProcessingStepsBarChart steps={latest.steps ?? []} />
          <FeatureNamesTable names={latest.featureNames ?? []} />
        </>
      ) : (
        !loading && <p className={styles.dropzoneHint}>No cached feature extraction results.</p>
      )}
    </div>
  );
}
