"use client";

import { useCallback, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import { deletePatientDtdl, generatePatientDtdl, getPatientDtdl } from "../../lib/digitalTwinsApi";
import { useExperimentStepLoad, useLatestRef } from "../multi-omics/useExperimentStepLoad";
import moi from "../multi-omics/MultiOmics.module.css";
import dt from "./DigitalTwins.module.css";

export function PatientDtdlStep({
  experimentId,
  enabled,
  onComplete,
  onError,
}: {
  experimentId: string;
  enabled: boolean;
  onComplete: () => void;
  onError: (message: string) => void;
}) {
  const [model, setModel] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const onCompleteRef = useLatestRef(onComplete);
  const onErrorRef = useLatestRef(onError);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const result = await getPatientDtdl(experimentId);
      setModel(result);
      if (result) onCompleteRef.current();
    } catch (err) {
      onErrorRef.current(err instanceof ApiError ? err.message : "Could not load DTDL model.");
    } finally {
      setLoading(false);
    }
  }, [enabled, experimentId]);

  useExperimentStepLoad(experimentId, load);

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const result = await generatePatientDtdl(experimentId);
      if (result.message) {
        /* 409 is treated as success — model already exists */
      }
      onComplete();
      await load();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not create the Patient DTDL model.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deletePatientDtdl(experimentId);
      setModel(null);
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not delete the Patient DTDL model.");
    } finally {
      setBusy(false);
    }
  };

  const contents = Array.isArray(model?.contents) ? model.contents : [];

  return (
    <div className={moi.stepContent}>
      <p className={moi.dropzoneHint}>
        This model is created automatically after extract features (already-exists / 409 is OK). Re-run here only if
        Azure is missing <code>dtmi:com:patient;1</code>.
      </p>
      {!enabled ? (
        <p className={moi.dropzoneHint}>Extract features first so the Patient interface can be built.</p>
      ) : null}
      <div className={dt.toolbar}>
        <button type="button" className={moi.primaryBtn} onClick={() => void handleGenerate()} disabled={busy || !enabled}>
          {busy ? <span className={moi.spinner} /> : null}
          Generate DTDL model
        </button>
        <button type="button" className={dt.dangerBtn} onClick={() => void handleDelete()} disabled={busy || !model}>
          Delete model
        </button>
      </div>
      {loading ? <p className={moi.dropzoneHint}>Loading model…</p> : null}
      {model ? (
        <>
          <p className={moi.dropzoneHint}>
            {(model.displayName as string) ?? "Patient"} · {(model["@id"] as string) ?? "dtmi:com:patient;1"} ·{" "}
            {contents.length} contents
          </p>
          <pre className={moi.dropzoneHint} style={{ whiteSpace: "pre-wrap", maxHeight: 280, overflow: "auto" }}>
            {JSON.stringify(model, null, 2)}
          </pre>
        </>
      ) : (
        !loading && <p className={moi.dropzoneHint}>No Patient DTDL model loaded yet.</p>
      )}
    </div>
  );
}
