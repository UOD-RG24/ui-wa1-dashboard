"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import {
  generateApplySgccaWeights,
  getApplySgccaWeights,
} from "../../lib/multiOmicsApi";
import type { ApplySGCCAWeightsItem } from "../../lib/multiOmicsTypes";
import { syncMultiOmicsSection } from "../../lib/multiOmicsSectionSync";
import { ApplyWeightsBlockChart } from "./charts/ApplyWeightsBlockChart";
import { OutputBlobCard } from "./OutputBlobCard";
import styles from "./MultiOmics.module.css";

export function ApplySgccaWeightsStep({
  experimentId,
  datasetId,
  designMatrixBlobIds,
  weightsBlobId,
  onComplete,
  onError,
  onWorkflowRefresh,
}: {
  experimentId: string;
  datasetId: string;
  designMatrixBlobIds: [string, string] | null;
  weightsBlobId: string;
  onComplete: (weightedBlobIds: [string, string]) => void;
  onError: (message: string) => void;
  onWorkflowRefresh: () => void;
}) {
  const [items, setItems] = useState<ApplySGCCAWeightsItem[]>([]);
  const [indexColumn, setIndexColumn] = useState("sample_id");
  const [component, setComponent] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getApplySgccaWeights(experimentId);
      setItems(result);
      setLoadedAt(new Date().toLocaleString());
      const latest = result[result.length - 1];
      if (latest?.sgccaFeatureWeightedMatrixBlobId1 && latest?.sgccaFeatureWeightedMatrixBlobId2) {
        onComplete([latest.sgccaFeatureWeightedMatrixBlobId1, latest.sgccaFeatureWeightedMatrixBlobId2]);
      }
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not load apply-weights results.");
    }
  }, [experimentId, onComplete, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = items[items.length - 1]?.designMatrixDefinedFeatureMatrix;

  const handleGenerate = async () => {
    if (!datasetId || !designMatrixBlobIds || !weightsBlobId) {
      onError("Dataset, design matrix blobs, and weights blob are required.");
      return;
    }
    setGenerating(true);
    const started = Date.now();
    try {
      await syncMultiOmicsSection(experimentId, "Running");
      onWorkflowRefresh();
      await generateApplySgccaWeights(experimentId, {
        datasetId,
        sgccaFeatureWeightsBlobId: weightsBlobId,
        designMatrixBlobIds,
        weightsProcessRequest: { indexColumn, component },
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
      onError(err instanceof ApiError ? err.message : "Apply weights failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.formGrid}>
        <label>
          Index column
          <input value={indexColumn} onChange={(e) => setIndexColumn(e.target.value)} />
        </label>
        <label>
          Component
          <input type="number" min={1} value={component} onChange={(e) => setComponent(Number(e.target.value))} />
        </label>
      </div>
      <button type="button" className={styles.primaryBtn} onClick={() => void handleGenerate()} disabled={generating}>
        {generating ? <span className={styles.spinner} /> : null}
        Apply sGCCA weights
      </button>

      {loadedAt ? <p className={styles.timestamp}>Cached at: {loadedAt}</p> : null}

      {latest ? (
        <>
          <ApplyWeightsBlockChart outputs={latest.outputs ?? []} />
          <OutputBlobCard label="Weighted matrix blob 1" blobId={items[items.length - 1]?.sgccaFeatureWeightedMatrixBlobId1} />
          <OutputBlobCard label="Weighted matrix blob 2" blobId={items[items.length - 1]?.sgccaFeatureWeightedMatrixBlobId2} />
        </>
      ) : (
        <p className={styles.dropzoneHint}>No cached apply-weights results.</p>
      )}
    </div>
  );
}
