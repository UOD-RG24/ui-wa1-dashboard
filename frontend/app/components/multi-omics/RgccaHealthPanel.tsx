"use client";

import JsonView from "@uiw/react-json-view";
import { useCallback, useState } from "react";
import { ApiError } from "../../lib/apiClient";
import { getRgccaHealth } from "../../lib/multiOmicsApi";
import type { RgccaHealthResponse } from "../../lib/multiOmicsTypes";
import { RgccaHealthDoughnutChart } from "./charts/RgccaHealthDoughnutChart";
import styles from "./MultiOmics.module.css";
import { useExperimentStepLoad, useLatestRef } from "./useExperimentStepLoad";

export function RgccaHealthPanel({
  experimentId,
  onError,
}: {
  experimentId: string;
  onError: (message: string) => void;
}) {
  const [data, setData] = useState<RgccaHealthResponse | null>(null);
  const [healthy, setHealthy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);

  const onErrorRef = useLatestRef(onError);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRgccaHealth(experimentId);
      setData(result);
      setHealthy(true);
      setLoadedAt(new Date().toLocaleString());
    } catch (err) {
      setHealthy(false);
      if (err instanceof ApiError && err.status !== 502) {
        onErrorRef.current(err.message);
      }
      setData(err instanceof ApiError ? (err.body as RgccaHealthResponse) ?? { error: err.message } : null);
      setLoadedAt(new Date().toLocaleString());
    } finally {
      setLoading(false);
    }
  }, [experimentId]);

  useExperimentStepLoad(experimentId, load);

  return (
    <div className={styles.stepContent}>
      <div className={styles.healthLayout}>
        <RgccaHealthDoughnutChart healthy={healthy} />
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <button type="button" className={styles.secondaryBtn} onClick={() => void load()} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : null}
              Refresh
            </button>
            {loadedAt ? <span className={styles.timestamp}>Last checked: {loadedAt}</span> : null}
          </div>
          <div className={styles.jsonTree}>
            {data ? (
              <JsonView value={data} collapsed={2} displayDataTypes={false} />
            ) : (
              <p className={styles.dropzoneHint}>No health response yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
