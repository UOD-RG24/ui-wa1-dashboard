"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import {
  generateDefinedFeatureMatrix,
  getDefinedFeatureMatrix,
} from "../../lib/multiOmicsApi";
import type { Blob, CreateDefinedFeatureMatrixItem } from "../../lib/multiOmicsTypes";
import { syncMultiOmicsSection } from "../../lib/multiOmicsSectionSync";
import { DefinedMatrixComparisonChart } from "./charts/ApplyWeightsBlockChart";
import { BlobSelect } from "./BlobSelect";
import { OutputBlobCard } from "./OutputBlobCard";
import styles from "./MultiOmics.module.css";
import { VirtualizedFeatureCheckboxList } from "./VirtualizedFeatureCheckboxList";

export function DefinedFeatureMatrixStep({
  experimentId,
  datasetId,
  blobs,
  availableFeatures,
  onComplete,
  onError,
  onWorkflowRefresh,
}: {
  experimentId: string;
  datasetId: string;
  blobs: Blob[];
  availableFeatures: string[];
  onComplete: (blobIds: string[]) => void;
  onError: (message: string) => void;
  onWorkflowRefresh: () => void;
}) {
  const [items, setItems] = useState<CreateDefinedFeatureMatrixItem[]>([]);
  const [blobId, setBlobId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getDefinedFeatureMatrix(experimentId);
      setItems(result);
      setLoadedAt(new Date().toLocaleString());
      const ids = result.map((r) => r.designMatrixBlobId).filter(Boolean) as string[];
      if (ids.length >= 2) onComplete(ids);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not load defined matrix results.");
    }
  }, [experimentId, onComplete, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  const chartBlocks = useMemo(() => {
    return items.map((item, i) => {
      const info = item.designMatrixDefinedFeatureMatrix;
      return {
        label: `Block ${i + 1}`,
        selected: info?.selectedFeatureCount ?? selected.size,
        total: info?.totalFeatureCount ?? availableFeatures.length,
      };
    });
  }, [items, selected.size, availableFeatures.length]);

  const handleGenerate = async (blockLabel: string) => {
    if (!datasetId || !blobId || selected.size === 0) {
      onError("Select dataset, blob, and at least one feature.");
      return;
    }
    setGenerating(true);
    const started = Date.now();
    try {
      await syncMultiOmicsSection(experimentId, "Running");
      onWorkflowRefresh();
      await generateDefinedFeatureMatrix(experimentId, {
        datasetId,
        preprocessedMatrixBlobId: blobId,
        definedFeatures: Array.from(selected),
      });
      await syncMultiOmicsSection(experimentId, "Complete", {
        processingTimeMs: Date.now() - started,
        notes: blockLabel,
      });
      onWorkflowRefresh();
      await load();
    } catch (err) {
      await syncMultiOmicsSection(experimentId, "Failed", {
        notes: err instanceof ApiError ? err.message : "Generate failed",
      }).catch(() => undefined);
      onWorkflowRefresh();
      onError(err instanceof ApiError ? err.message : "Defined matrix generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={styles.stepContent}>
      <div className={styles.formGrid}>
        <BlobSelect blobs={blobs} value={blobId} onChange={setBlobId} label="Preprocessed matrix blob" />
      </div>

      <VirtualizedFeatureCheckboxList features={availableFeatures} selected={selected} onChange={setSelected} />

      <div className={styles.dualBlockForm}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={generating}
          onClick={() => void handleGenerate("Block 1")}
        >
          {generating ? <span className={styles.spinner} /> : null}
          Generate block 1 matrix
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={generating}
          onClick={() => void handleGenerate("Block 2")}
        >
          {generating ? <span className={styles.spinner} /> : null}
          Generate block 2 matrix
        </button>
      </div>

      {loadedAt ? <p className={styles.timestamp}>Cached at: {loadedAt}</p> : null}

      {items.length > 0 ? (
        <>
          <DefinedMatrixComparisonChart blocks={chartBlocks.length > 0 ? chartBlocks : [{ label: "Selection", selected: selected.size, total: availableFeatures.length }]} />
          {items.map((item, i) => (
            <OutputBlobCard key={i} label={`Design matrix blob ${i + 1}`} blobId={item.designMatrixBlobId} />
          ))}
        </>
      ) : (
        <p className={styles.dropzoneHint}>No cached defined matrix results.</p>
      )}
    </div>
  );
}
