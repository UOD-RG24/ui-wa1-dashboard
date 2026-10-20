"use client";

import { useCallback, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import { generatePatientTwins, getPatientTwinsCache, getPatientTwinsLive } from "../../lib/digitalTwinsApi";
import { syncDigitalTwinSection } from "../../lib/digitalTwinsSectionSync";
import type { DtGenerateTwinsItem } from "../../lib/digitalTwinsTypes";
import { useExperimentStepLoad, useLatestRef } from "../multi-omics/useExperimentStepLoad";
import moi from "../multi-omics/MultiOmics.module.css";
import ui from "../ui/Ui.module.css";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollTwinsAfterGatewayTimeout(experimentId: string): Promise<DtGenerateTwinsItem | null> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    const cached = await getPatientTwinsCache(experimentId);
    if (cached) return cached;
    await getPatientTwinsLive(experimentId).catch(() => null);
    await sleep(4000);
  }
  return getPatientTwinsCache(experimentId);
}

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
  const [recoveryNote, setRecoveryNote] = useState<string | null>(null);

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
    setRecoveryNote(null);
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
      const gatewayTimeout = err instanceof ApiError && (err.status === 502 || err.status === 504);
      if (gatewayTimeout) {
        const recovered = await pollTwinsAfterGatewayTimeout(experimentId);
        if (recovered) {
          await syncDigitalTwinSection(experimentId, "Complete", { processingTimeMs: Date.now() - started }).catch(
            () => undefined,
          );
          onWorkflowRefresh();
          setItem(recovered);
          onComplete(recovered);
          setRecoveryNote("Gateway timed out; twins were saved.");
          return;
        }
      }
      const message = err instanceof ApiError ? err.message : "Could not generate patient twins.";
      await syncDigitalTwinSection(experimentId, "Failed", { notes: message }).catch(() => undefined);
      onWorkflowRefresh();
      onError(message);
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
      {generating ? (
        <p className={moi.dropzoneHint}>
          This can take a few minutes. If the gateway times out, the app will check cache for saved twins.
        </p>
      ) : null}
      {recoveryNote ? <p className={moi.timestamp}>{recoveryNote}</p> : null}
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
