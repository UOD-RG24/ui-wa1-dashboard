"use client";

import { useCallback, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import {
  generateExtractSgccaWeights,
  getExtractSgccaWeights,
} from "../../lib/multiOmicsApi";
import type { ExtractSGCCAWeightsItem } from "../../lib/multiOmicsTypes";
import { syncMultiOmicsSection } from "../../lib/multiOmicsSectionSync";
import { BlockComparisonBarChart } from "./charts/BlockComparisonBarChart";
import { ProcessingStepsBarChart } from "./charts/ProcessingStepsBarChart";
import { SparsityBarChart, WeightsFunnelBarChart } from "./charts/WeightsFunnelBarChart";
import { OutputBlobCard } from "./OutputBlobCard";
import styles from "./MultiOmics.module.css";
import { useExperimentStepLoad, useLatestRef } from "./useExperimentStepLoad";

export function ExtractSgccaWeightsStep({
  experimentId,
  datasetId,
  designMatrixBlobIds,
  onComplete,
  onError,
  onWorkflowRefresh,
}: {
  experimentId: string;
  datasetId: string;
  designMatrixBlobIds: [string, string] | null;
  onComplete: (weightsBlobId: string) => void;
  onError: (message: string) => void;
  onWorkflowRefresh: () => void;
}) {
  const [items, setItems] = useState<ExtractSGCCAWeightsItem[]>([]);
  const [indexColumn, setIndexColumn] = useState("sample_id");
  const [scheme, setScheme] = useState("horst");
  const [sparsity0, setSparsity0] = useState(0.5);
  const [sparsity1, setSparsity1] = useState(0.5);
  const [generating, setGenerating] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const onCompleteRef = useLatestRef(onComplete);
  const onErrorRef = useLatestRef(onError);

  const load = useCallback(async () => {
    try {
      const result = await getExtractSgccaWeights(experimentId);
      setItems(result);
      setLoadedAt(new Date().toLocaleString());
      const blobId = result[result.length - 1]?.sgccaWeightsMatrixBlobId;
      if (blobId) onCompleteRef.current(blobId);
    } catch (err) {
      onErrorRef.current(err instanceof ApiError ? err.message : "Could not load weights results.");
    }
  }, [experimentId]);

  useExperimentStepLoad(experimentId, load);

  const latestItem = items.length > 0 ? items[items.length - 1] : null;
  const latest = latestItem?.extractSGCCAWeights;

  const handleGenerate = async () => {
    if (!datasetId || !designMatrixBlobIds) {
      onError("Two design matrix blob IDs are required from step 3.");
      return;
    }
    setGenerating(true);
    const started = Date.now();
    try {
      await syncMultiOmicsSection(experimentId, "Running");
      onWorkflowRefresh();
      await generateExtractSgccaWeights(experimentId, {
        datasetId,
        designMatrixBlobIds,
        weightsProcessRequest: {
          indexColumn,
          sparsity: [sparsity0, sparsity1],
          scheme,
        },
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
      onError(err instanceof ApiError ? err.message : "Extract weights failed.");
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
          Scheme
          <input value={scheme} onChange={(e) => setScheme(e.target.value)} />
        </label>
        <label>
          Sparsity block 1
          <input type="number" min={0} max={1} step={0.01} value={sparsity0} onChange={(e) => setSparsity0(Number(e.target.value))} />
        </label>
        <label>
          Sparsity block 2
          <input type="number" min={0} max={1} step={0.01} value={sparsity1} onChange={(e) => setSparsity1(Number(e.target.value))} />
        </label>
      </div>
      <SparsityBarChart sparsity={[sparsity0, sparsity1]} />
      <button type="button" className={styles.primaryBtn} onClick={() => void handleGenerate()} disabled={generating}>
        {generating ? <span className={styles.spinner} /> : null}
        Extract sGCCA weights
      </button>

      {loadedAt ? <p className={styles.timestamp}>Cached at: {loadedAt}</p> : null}

      {latest ? (
        <>
          <BlockComparisonBarChart blockDetails={latest.blockDetails ?? {}} />
          <WeightsFunnelBarChart
            weightsExtracted={latest.weightsExtracted}
            selectedWeights={latest.selectedWeights}
            selectedFeatures={latest.selectedFeatures}
          />
          <ProcessingStepsBarChart steps={latest.steps ?? []} extraTall />
          <OutputBlobCard label="sGCCA weights blob" blobId={latestItem?.sgccaWeightsMatrixBlobId} />
        </>
      ) : (
        <p className={styles.dropzoneHint}>No cached extract-weights results.</p>
      )}
    </div>
  );
}
