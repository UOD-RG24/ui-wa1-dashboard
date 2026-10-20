"use client";

import { useCallback, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import {
  generateFinalSelectedMatrix,
  getFinalSelectedMatrix,
} from "../../lib/multiOmicsApi";
import type { CreateFinalSelectedMatrixItem } from "../../lib/multiOmicsTypes";
import { syncMultiOmicsSection } from "../../lib/multiOmicsSectionSync";
import { FinalMatrixBarChart } from "./charts/ApplyWeightsBlockChart";
import { ProcessingStepsBarChart } from "./charts/ProcessingStepsBarChart";
import { OutputBlobCard } from "./OutputBlobCard";
import styles from "./MultiOmics.module.css";
import { useExperimentStepLoad, useLatestRef } from "./useExperimentStepLoad";

export function FinalSelectedMatrixStep({
  experimentId,
  datasetId,
  weightsBlobId,
  weightedMatrixBlobId,
  onError,
  onWorkflowRefresh,
}: {
  experimentId: string;
  datasetId: string;
  weightsBlobId: string;
  weightedMatrixBlobId: string;
  onError: (message: string) => void;
  onWorkflowRefresh: () => void;
}) {
  const [items, setItems] = useState<CreateFinalSelectedMatrixItem[]>([]);
  const [block, setBlock] = useState("block1");
  const [identifierColumn, setIdentifierColumn] = useState("feature_id");
  const [generating, setGenerating] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const onErrorRef = useLatestRef(onError);

  const load = useCallback(async () => {
    try {
      const result = await getFinalSelectedMatrix(experimentId);
      setItems(result);
      setLoadedAt(new Date().toLocaleString());
    } catch (err) {
      onErrorRef.current(err instanceof ApiError ? err.message : "Could not load final matrix results.");
    }
  }, [experimentId]);

  useExperimentStepLoad(experimentId, load);

  const latestItem = items.length > 0 ? items[items.length - 1] : null;
  const latest = latestItem?.createFinalSelectedMatrix;

  const handleGenerate = async () => {
    if (!datasetId || !weightsBlobId || !weightedMatrixBlobId) {
      onError("Dataset, weights blob, and weighted matrix blob are required.");
      return;
    }
    setGenerating(true);
    const started = Date.now();
    try {
      await syncMultiOmicsSection(experimentId, "Running");
      onWorkflowRefresh();
      await generateFinalSelectedMatrix(experimentId, {
        datasetId,
        sgccaFeatureWeightsBlobId: weightsBlobId,
        sgccaFeatureWeightedMatrixBlobId: weightedMatrixBlobId,
        weightsProcessRequest: { block, identifierColumn },
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
      onError(err instanceof ApiError ? err.message : "Final matrix generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.formGrid}>
        <label>
          Block
          <input value={block} onChange={(e) => setBlock(e.target.value)} />
        </label>
        <label>
          Identifier column
          <input value={identifierColumn} onChange={(e) => setIdentifierColumn(e.target.value)} />
        </label>
      </div>
      <button type="button" className={styles.primaryBtn} onClick={() => void handleGenerate()} disabled={generating}>
        {generating ? <span className={styles.spinner} /> : null}
        Create final selected matrix
      </button>

      {loadedAt ? <p className={styles.timestamp}>Cached at: {loadedAt}</p> : null}

      {latest ? (
        <>
          <FinalMatrixBarChart
            rowCount={latest.rowCount}
            columnCount={latest.columnCount}
            selectedFeatureCount={latest.selectedFeatureCount}
          />
          <ProcessingStepsBarChart steps={latest.steps ?? []} />
          <OutputBlobCard label="Final selected matrix blob" blobId={latestItem?.finalSelectedMatrixBlobId} />
        </>
      ) : (
        <p className={styles.dropzoneHint}>No cached final matrix results.</p>
      )}
    </div>
  );
}
