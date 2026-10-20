"use client";

import { useCallback, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import { extractPatientRelationships, getPatientRelationshipsCache } from "../../lib/digitalTwinsApi";
import type { DtGenerateRelationshipsItem } from "../../lib/digitalTwinsTypes";
import { BlobSelect } from "../multi-omics/BlobSelect";
import { useExperimentStepLoad, useLatestRef } from "../multi-omics/useExperimentStepLoad";
import type { Blob } from "../../lib/multiOmicsTypes";
import moi from "../multi-omics/MultiOmics.module.css";
import ui from "../ui/Ui.module.css";

export function ExtractRelationshipsStep({
  experimentId,
  datasetId,
  blobs,
  processedBlobId,
  onProcessedBlobIdChange,
  enabled,
  onComplete,
  onError,
}: {
  experimentId: string;
  datasetId: string;
  blobs: Blob[];
  processedBlobId: string;
  onProcessedBlobIdChange: (id: string) => void;
  enabled: boolean;
  onComplete: (item: DtGenerateRelationshipsItem) => void;
  onError: (message: string) => void;
}) {
  const [item, setItem] = useState<DtGenerateRelationshipsItem | null>(null);
  const [minimumSimilarity, setMinimumSimilarity] = useState("0.80");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const onCompleteRef = useLatestRef(onComplete);
  const onErrorRef = useLatestRef(onError);

  const load = useCallback(async () => {
    if (!processedBlobId) return;
    setLoading(true);
    try {
      const result = await getPatientRelationshipsCache(experimentId, processedBlobId);
      setItem(result);
      if (result) onCompleteRef.current(result);
    } catch (err) {
      onErrorRef.current(err instanceof ApiError ? err.message : "Could not load cached relationships.");
    } finally {
      setLoading(false);
    }
  }, [experimentId, processedBlobId]);

  useExperimentStepLoad(`${experimentId}:${processedBlobId}`, load);

  const handleExtract = async () => {
    if (!datasetId || !processedBlobId) {
      onError("Select a dataset and a final-selected matrix blob.");
      return;
    }
    const similarity = Number(minimumSimilarity);
    if (!Number.isFinite(similarity) || similarity < 0 || similarity > 1) {
      onError("Minimum similarity must be a number between 0 and 1.");
      return;
    }
    setRunning(true);
    try {
      await extractPatientRelationships(experimentId, {
        datasetId,
        finalSelectedMatrixBlobId: processedBlobId,
        minimumSimilarity: similarity,
      });
      await load();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not extract relationships.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={moi.stepContent}>
      {!enabled ? <p className={moi.dropzoneHint}>Generate twins before extracting relationships.</p> : null}
      <p className={moi.dropzoneHint}>
        Defaults to the first MOI final selected matrix and cosine threshold 0.80.
      </p>
      <div className={moi.formGrid}>
        <BlobSelect
          blobs={blobs}
          value={processedBlobId}
          onChange={onProcessedBlobIdChange}
          label="Final selected matrix blob"
        />
        <label>
          Minimum cosine similarity
          <input value={minimumSimilarity} onChange={(event) => setMinimumSimilarity(event.target.value)} />
        </label>
      </div>
      <button type="button" className={moi.primaryBtn} onClick={() => void handleExtract()} disabled={running || !enabled}>
        {running ? <span className={moi.spinner} /> : null}
        Extract relationships
      </button>
      {loading ? <p className={moi.dropzoneHint}>Loading cached pairs…</p> : null}
      {item ? (
        <div className={ui.metricStrip}>
          <div className={ui.metricCell}>
            <p className={ui.metricLabel}>Patients</p>
            <p className={ui.metricValue}>{item.patientCount ?? "—"}</p>
          </div>
          <div className={ui.metricCell}>
            <p className={ui.metricLabel}>Pairs above threshold</p>
            <p className={ui.metricValue}>{item.patientRelationships?.length ?? 0}</p>
          </div>
        </div>
      ) : (
        !loading && <p className={moi.dropzoneHint}>No cached relationship pairs for this blob.</p>
      )}
    </div>
  );
}
