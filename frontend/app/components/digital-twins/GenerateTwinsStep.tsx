"use client";

import { useCallback, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import { generatePatientTwins, getPatientTwinsCache } from "../../lib/digitalTwinsApi";
import { syncDigitalTwinSection } from "../../lib/digitalTwinsSectionSync";
import type { DtGenerateTwinsItem } from "../../lib/digitalTwinsTypes";
import { useExperimentStepLoad, useLatestRef } from "../multi-omics/useExperimentStepLoad";
import moi from "../multi-omics/MultiOmics.module.css";
import ui from "../ui/Ui.module.css";

export function GenerateTwinsStep({
  experimentId,
  datasetId,
  selectedBlobIds,
  enabled,
  onComplete,
  onError,
  onWorkflowRefresh,
}: {
  experimentId: string;
  datasetId: string;
  selectedBlobIds: string[];
  enabled: boolean;
  onComplete: (item: DtGenerateTwinsItem) => void;
  onError: (message: string) => void;
  onWorkflowRefresh: () => void;
}) {
  const [item, setItem] = useState<DtGenerateTwinsItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const onCompleteRef = useLatestRef(onComplete);
  const onErrorRef = useLatestRef(onError);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPatientTwinsCache(experimentId);
      setItem(result);
      if (result) onCompleteRef.current(result);
    } catch (err) {
      onErrorRef.current(err instanceof ApiError ? err.message : "Could not load cached twins.");
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
      await generatePatientTwins(experimentId, {
        datasetId,
        finalSelectedMatrixBlobIds: selectedBlobIds,
      });
      await syncDigitalTwinSection(experimentId, "Complete", { processingTimeMs: Date.now() - started });
      onWorkflowRefresh();
      await load();
    } catch (err) {
      await syncDigitalTwinSection(experimentId, "Failed", {
        notes: err instanceof ApiError ? err.message : "Generate twins failed",
      }).catch(() => undefined);
      onWorkflowRefresh();
      onError(err instanceof ApiError ? err.message : "Could not generate patient twins.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={moi.stepContent}>
      {!enabled ? <p className={moi.dropzoneHint}>Extract features first. The Patient DTDL model is created automatically after that.</p> : null}
      <button
        type="button"
        className={moi.primaryBtn}
        onClick={() => void handleGenerate()}
        disabled={generating || !enabled}
      >
        {generating ? <span className={moi.spinner} /> : null}
        Generate patient twins
      </button>
      {loading ? <p className={moi.dropzoneHint}>Loading cached twins…</p> : null}
      {item ? (
        <div className={ui.metricStrip}>
          <div className={ui.metricCell}>
            <p className={ui.metricLabel}>Patients</p>
            <p className={ui.metricValue}>{item.patientCount ?? item.rows?.length ?? "—"}</p>
          </div>
          <div className={ui.metricCell}>
            <p className={ui.metricLabel}>Features</p>
            <p className={ui.metricValue}>{item.featureKeys?.length ?? "—"}</p>
          </div>
          <div className={ui.metricCell}>
            <p className={ui.metricLabel}>Generated</p>
            <p className={ui.metricValue} style={{ fontSize: "calc(16px * var(--ui-scale))" }}>
              {item.generatedAt ? new Date(item.generatedAt).toLocaleString() : "—"}
            </p>
          </div>
        </div>
      ) : (
        !loading && <p className={moi.dropzoneHint}>No cached twins yet.</p>
      )}
    </div>
  );
}
