"use client";

import { useCallback, useMemo, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import {
  generateDefinedFeatureMatrix,
  getDefinedFeatureMatrix,
} from "../../lib/multiOmicsApi";
import type { Blob, CreateDefinedFeatureMatrixItem } from "../../lib/multiOmicsTypes";
import { normalizeDefinedFeatureMatrix } from "../../lib/multiOmicsMappers";
import { syncMultiOmicsSection } from "../../lib/multiOmicsSectionSync";
import { DefinedMatrixComparisonChart } from "./charts/ApplyWeightsBlockChart";
import { BlobSelect } from "./BlobSelect";
import { OutputBlobCard } from "./OutputBlobCard";
import styles from "./MultiOmics.module.css";
import { VirtualizedFeatureCheckboxList } from "./VirtualizedFeatureCheckboxList";
import { useExperimentStepLoad, useLatestRef } from "./useExperimentStepLoad";

function uniqueBlobIds(items: CreateDefinedFeatureMatrixItem[]): string[] {
  return [...new Set(items.map((item) => item.designMatrixBlobId).filter(Boolean) as string[])];
}

export function DefinedFeatureMatrixStep({
  experimentId,
  datasetId,
  blobs,
  availableFeatures,
  onComplete,
  onError,
  onWorkflowRefresh,
  onBlobsChanged,
}: {
  experimentId: string;
  datasetId: string;
  blobs: Blob[];
  availableFeatures: string[];
  onComplete: (blobIds: string[]) => void;
  onError: (message: string) => void;
  onWorkflowRefresh: () => void;
  onBlobsChanged?: () => void;
}) {
  const [items, setItems] = useState<CreateDefinedFeatureMatrixItem[]>([]);
  const [block1BlobId, setBlock1BlobId] = useState("");
  const [block2BlobId, setBlock2BlobId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const onCompleteRef = useLatestRef(onComplete);
  const onErrorRef = useLatestRef(onError);

  const load = useCallback(async () => {
    try {
      const result = await getDefinedFeatureMatrix(experimentId);
      setItems(result);
      setLoadedAt(new Date().toLocaleString());
      onCompleteRef.current(uniqueBlobIds(result));
    } catch (err) {
      onErrorRef.current(err instanceof ApiError ? err.message : "Could not load defined matrix results.");
    }
  }, [experimentId]);

  useExperimentStepLoad(experimentId, load);

  const designCount = uniqueBlobIds(items).length;

  const chartBlocks = useMemo(() => {
    return items.map((item, i) => {
      const info = normalizeDefinedFeatureMatrix(item);
      return {
        label: `Block ${i + 1}`,
        selected: info?.selectedFeatureCount ?? selected.size,
        total: info?.totalFeatureCount ?? availableFeatures.length,
      };
    });
  }, [items, selected.size, availableFeatures.length]);

  const handleGenerate = async (block: 1 | 2) => {
    const blobId = block === 1 ? block1BlobId : block2BlobId;
    if (!datasetId || !blobId) {
      onError(`Select a dataset and a Block ${block} preprocessed matrix blob.`);
      return;
    }
    if (block1BlobId && block2BlobId && block1BlobId === block2BlobId) {
      onError(
        "Block 1 and Block 2 must use different omics files. Using the same blob replaces the previous design matrix.",
      );
      return;
    }
    if (availableFeatures.length === 0) {
      onError(
        "No features available. Run Step 3 (Feature extraction) for this blob first, then return here.",
      );
      return;
    }
    if (selected.size === 0) {
      onError("Select at least one feature from the list (use Select all or check individual features).");
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
        notes: `Block ${block}`,
      });
      onWorkflowRefresh();
      onBlobsChanged?.();
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
      <p className={styles.dropzoneHint}>
        sGCCA needs two omics blocks. Generate Block 1 from mRNA (or similar) and Block 2 from a{" "}
        <b>different</b> CNA file. Same file for both overwrites the first matrix.
      </p>
      <p className={styles.timestamp}>
        {designCount} of 2 design matrices
        {designCount < 2 ? " — Extract weights stays locked until both blocks exist." : " — Extract weights is unlocked."}
      </p>
      <div className={styles.formGrid}>
        <BlobSelect
          blobs={blobs}
          value={block1BlobId}
          onChange={setBlock1BlobId}
          label="Block 1 preprocessed blob (e.g. mRNA)"
        />
        <BlobSelect
          blobs={blobs}
          value={block2BlobId}
          onChange={setBlock2BlobId}
          label="Block 2 preprocessed blob (e.g. CNA)"
        />
      </div>

      <VirtualizedFeatureCheckboxList features={availableFeatures} selected={selected} onChange={setSelected} />

      {availableFeatures.length === 0 ? (
        <p className={styles.dropzoneHint}>
          Feature list is empty. Complete Step 3 for each preprocessed blob, then scroll back here.
        </p>
      ) : null}

      <div className={styles.dualBlockForm}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={generating}
          onClick={() => void handleGenerate(1)}
        >
          {generating ? <span className={styles.spinner} /> : null}
          Generate block 1 matrix
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={generating}
          onClick={() => void handleGenerate(2)}
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
            <OutputBlobCard key={item.designMatrixBlobId ?? i} label={`Design matrix blob ${i + 1}`} blobId={item.designMatrixBlobId} />
          ))}
        </>
      ) : (
        <p className={styles.dropzoneHint}>No cached defined matrix results.</p>
      )}
    </div>
  );
}
