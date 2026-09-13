"use client";

import { useCallback, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import { generateDtFeatureExtraction, getDtFeatureExtraction } from "../../lib/digitalTwinsApi";
import { featureTypeEntries } from "../../lib/digitalTwinsMappers";
import { syncDigitalTwinSection } from "../../lib/digitalTwinsSectionSync";
import type { DtFeatureExtractionItem } from "../../lib/digitalTwinsTypes";
import type { Blob } from "../../lib/multiOmicsTypes";
import { useExperimentStepLoad, useLatestRef } from "../multi-omics/useExperimentStepLoad";
import moi from "../multi-omics/MultiOmics.module.css";
import ui from "../ui/Ui.module.css";
import { BlobMultiSelect } from "./BlobMultiSelect";

export function ExtractFeaturesStep({
  experimentId,
  datasetId,
  blobs,
  selectedBlobIds,
  onSelectedBlobIdsChange,
  onComplete,
  onError,
  onWorkflowRefresh,
}: {
  experimentId: string;
  datasetId: string;
  blobs: Blob[];
  selectedBlobIds: string[];
  onSelectedBlobIdsChange: (ids: string[]) => void;
  onComplete: () => void;
  onError: (message: string) => void;
  onWorkflowRefresh: () => void;
}) {
  const [item, setItem] = useState<DtFeatureExtractionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const onCompleteRef = useLatestRef(onComplete);
  const onErrorRef = useLatestRef(onError);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDtFeatureExtraction(experimentId);
      setItem(result);
      setLoadedAt(new Date().toLocaleString());
      if (result) onCompleteRef.current();
    } catch (err) {
      onErrorRef.current(err instanceof ApiError ? err.message : "Could not load feature extraction.");
    } finally {
      setLoading(false);
    }
  }, [experimentId]);

  useExperimentStepLoad(experimentId, load);

  const handleGenerate = async () => {
    if (!datasetId || selectedBlobIds.length === 0) {
      onError("Select a dataset and at least one final-selected matrix blob.");
      return;
    }
    setGenerating(true);
    const started = Date.now();
    try {
      await syncDigitalTwinSection(experimentId, "Running");
      onWorkflowRefresh();
      await generateDtFeatureExtraction(experimentId, {
        datasetId,
        finalSelectedMatrixBlobIds: selectedBlobIds,
      });
      await syncDigitalTwinSection(experimentId, "Complete", { processingTimeMs: Date.now() - started });
      onWorkflowRefresh();
      await load();
    } catch (err) {
      await syncDigitalTwinSection(experimentId, "Failed", {
        notes: err instanceof ApiError ? err.message : "Generate failed",
      }).catch(() => undefined);
      onWorkflowRefresh();
      onError(err instanceof ApiError ? err.message : "Digital-twin feature extraction failed.");
    } finally {
      setGenerating(false);
    }
  };

  const features = featureTypeEntries(item);

  return (
    <div className={moi.stepContent}>
      <BlobMultiSelect blobs={blobs} value={selectedBlobIds} onChange={onSelectedBlobIdsChange} />
      <button type="button" className={moi.primaryBtn} onClick={() => void handleGenerate()} disabled={generating}>
        {generating ? <span className={moi.spinner} /> : null}
        Extract features
      </button>
      {loading ? <p className={moi.dropzoneHint}>Loading cached results…</p> : null}
      {loadedAt ? <p className={moi.timestamp}>Cached at: {loadedAt}</p> : null}
      {item ? (
        <>
          <div className={ui.metricStrip}>
            <div className={ui.metricCell}>
              <p className={ui.metricLabel}>Columns</p>
              <p className={ui.metricValue}>{features.length}</p>
            </div>
            <div className={ui.metricCell}>
              <p className={ui.metricLabel}>Blobs processed</p>
              <p className={ui.metricValue}>{item.blobIdsProcessed?.length ?? "—"}</p>
            </div>
            <div className={ui.metricCell}>
              <p className={ui.metricLabel}>Elapsed</p>
              <p className={ui.metricValue}>
                {item.timeElapsedSeconds != null ? `${item.timeElapsedSeconds.toFixed(1)}s` : "—"}
              </p>
            </div>
          </div>
          <div className={moi.tableWrap}>
            <table className={moi.table}>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Inferred types</th>
                </tr>
              </thead>
              <tbody>
                {features.slice(0, 80).map(([name, types]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{types}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {features.length > 80 ? <p className={moi.dropzoneHint}>Showing first 80 of {features.length} columns.</p> : null}
        </>
      ) : (
        !loading && (
          <p className={moi.dropzoneHint}>
            No cached extraction. Run this after multi-omics produces final-selected matrices.
          </p>
        )
      )}
    </div>
  );
}
