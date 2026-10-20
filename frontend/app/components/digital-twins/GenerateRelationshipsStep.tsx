"use client";

import { useState } from "react";
import { ApiError } from "../../lib/apiClient";
import { deleteNamedRelationships, generateNamedRelationships } from "../../lib/digitalTwinsApi";
import moi from "../multi-omics/MultiOmics.module.css";
import dt from "./DigitalTwins.module.css";

const RELATIONSHIP_NAMES = ["mrnaRelationship", "cnaRelationship"] as const;

export function GenerateRelationshipsStep({
  experimentId,
  processedBlobId,
  enabled,
  onChanged,
  onError,
}: {
  experimentId: string;
  processedBlobId: string;
  enabled: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [relationshipName, setRelationshipName] = useState<string>(RELATIONSHIP_NAMES[0]);
  const [max, setMax] = useState("3");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const parsedMax = Number(max);

  const handleGenerate = async () => {
    if (!processedBlobId) {
      onError("Extract relationships first so a processed blob ID is available.");
      return;
    }
    if (!Number.isInteger(parsedMax) || parsedMax <= 0) {
      onError("Max per source twin must be a positive integer.");
      return;
    }
    setBusy(true);
    try {
      const result = await generateNamedRelationships(experimentId, processedBlobId, relationshipName, parsedMax);
      setSummary(JSON.stringify(result, null, 2));
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not generate Azure relationships.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!processedBlobId) {
      onError("Extract relationships first so a processed blob ID is available.");
      return;
    }
    if (!Number.isInteger(parsedMax) || parsedMax <= 0) {
      onError("Max per source twin must be a positive integer.");
      return;
    }
    setBusy(true);
    try {
      const result = await deleteNamedRelationships(experimentId, processedBlobId, relationshipName, parsedMax);
      setSummary(JSON.stringify(result, null, 2));
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not delete Azure relationships.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={moi.stepContent}>
      {!enabled ? <p className={moi.dropzoneHint}>Extract cosine pairs before writing relationships to Azure.</p> : null}
      <div className={moi.formGrid}>
        <label>
          Relationship name
          <select value={relationshipName} onChange={(event) => setRelationshipName(event.target.value)}>
            {RELATIONSHIP_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Max per source twin
          <input value={max} onChange={(event) => setMax(event.target.value)} />
        </label>
      </div>
      <div className={dt.toolbar}>
        <button
          type="button"
          className={moi.primaryBtn}
          onClick={() => void handleGenerate()}
          disabled={busy || !enabled}
        >
          {busy ? <span className={moi.spinner} /> : null}
          Generate relationships
        </button>
        <button type="button" className={dt.dangerBtn} onClick={() => void handleDelete()} disabled={busy || !enabled}>
          Delete generated relationships
        </button>
      </div>
      {summary ? (
        <pre className={moi.dropzoneHint} style={{ whiteSpace: "pre-wrap", maxHeight: 180, overflow: "auto" }}>
          {summary}
        </pre>
      ) : null}
    </div>
  );
}
