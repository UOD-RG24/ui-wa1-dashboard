"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel } from "../../components/ui/Panel";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Section } from "../../components/ui/Section";
import ui from "../../components/ui/Ui.module.css";
import type {
  DatasetItem,
  Experiment,
  PipelineRun,
  PipelineTwinResults,
} from "../../types";
import styles from "./PipelinePage.module.css";

const roles = ["mrna", "cna", "clinical"] as const;
type InputRole = (typeof roles)[number];

const roleLabels: Record<InputRole, string> = {
  mrna: "mRNA expression",
  cna: "Copy-number alteration",
  clinical: "Clinical labels and split",
};

function messageFrom(response: Response, fallback: string) {
  return response
    .clone()
    .json()
    .then((body: { message?: string; title?: string }) => body.message ?? body.title ?? fallback)
    .catch(() => response.text().then((text) => text || fallback));
}

function datasetValid(dataset: DatasetItem | undefined, role: InputRole) {
  return Boolean(
    dataset &&
      dataset.omicsType?.toLowerCase() === role &&
      dataset.status?.toLowerCase() === "active" &&
      ["csv", "tsv"].includes(dataset.fileType?.toLowerCase() ?? "") &&
      dataset.sha256,
  );
}

function twinId(twin: Record<string, unknown>) {
  return String(twin.$dtId ?? twin.id ?? twin.Id ?? "unknown-twin");
}

function relationshipField(relationship: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (relationship[key] !== undefined) return String(relationship[key]);
  }
  return "";
}

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toPrecision(5);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function RunGraph({ results }: { results: PipelineTwinResults }) {
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const twinsById = useMemo(
    () => new Map(results.twins.map((twin) => [twinId(twin), twin])),
    [results.twins],
  );
  const nodes = useMemo<Node[]>(() => {
    const total = Math.max(results.twins.length, 1);
    return results.twins.map((twin, index) => {
      const angle = (index / total) * Math.PI * 2;
      return {
        id: twinId(twin),
        position: { x: 310 + Math.cos(angle) * 250, y: 220 + Math.sin(angle) * 180 },
        data: { label: twinId(twin), twin },
        className: styles.twinNode,
      };
    });
  }, [results.twins]);
  const edges = useMemo<Edge[]>(
    () =>
      results.relationships
        .flatMap((relationship, index): Edge[] => {
          const source = relationshipField(relationship, "$sourceId", "sourceId", "SourceId");
          const target = relationshipField(relationship, "$targetId", "targetId", "TargetId");
          if (!twinsById.has(source) || !twinsById.has(target)) return [];
          return [{
            id:
              relationshipField(relationship, "$relationshipId", "id", "Id") ||
              `${source}-${target}-${index}`,
            source,
            target,
            label: relationshipField(relationship, "$relationshipName", "name", "Name"),
          } satisfies Edge];
        }),
    [results.relationships, twinsById],
  );
  const properties = selected
    ? Object.entries(selected).filter(
        ([key]) => !key.startsWith("$") && !["id", "Id", "metadata", "Metadata"].includes(key),
      )
    : [];

  return (
    <div className={styles.twinLayout}>
      <div className={styles.flowCanvas}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeClick={(_, node) => setSelected(node.data.twin as Record<string, unknown>)}
        >
          <Background color="#4b637b" gap={20} />
          <MiniMap pannable zoomable />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <Panel title="Selected live twin" meta={selected ? twinId(selected) : "Select a node"}>
        {selected ? (
          <dl className={styles.propertyList}>
            {properties.map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{displayValue(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className={ui.muted}>Select a live ADT node to inspect its recorded feature values.</p>
        )}
      </Panel>
    </div>
  );
}

export function LiveExperimentPage({
  experiment,
  datasets,
  onDatasetCreated,
  onExperimentCreated,
}: {
  experiment?: Experiment;
  datasets: DatasetItem[];
  onDatasetCreated: (dataset: DatasetItem) => void;
  onExperimentCreated: (experiment: Experiment) => void;
}) {
  const [newExperimentName, setNewExperimentName] = useState("");
  const [selection, setSelection] = useState<Record<InputRole, string>>({ mrna: "", cna: "", clinical: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [results, setResults] = useState<{ attempt: number; data: PipelineTwinResults } | null>(null);
  const [resultsFailure, setResultsFailure] = useState<{ runId: string; attempt: number; message: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentRun = runs.find((run) => run.runId === selectedRunId) ?? runs[0];
  const selected = useMemo(
    () =>
      Object.fromEntries(
        roles.map((role) => [role, datasets.find((dataset) => dataset.id === selection[role])]),
      ) as Record<InputRole, DatasetItem | undefined>,
    [datasets, selection],
  );
  const ready = roles.every((role) => datasetValid(selected[role], role));

  const refreshRuns = useCallback(async () => {
    if (!experiment) return;
    const response = await fetch(`/api/core/experiments/${experiment.id}/runs`, { cache: "no-store" });
    if (!response.ok) throw new Error(await messageFrom(response, "Pipeline runs could not be loaded."));
    const value = (await response.json()) as PipelineRun[];
    setRuns(value);
    setSelectedRunId((current) => (value.some((run) => run.runId === current) ? current : value[0]?.runId ?? ""));
  }, [experiment]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshRuns().catch((reason: Error) => setError(reason.message));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshRuns]);

  useEffect(() => {
    if (!currentRun || !["queued", "running", "cancellationRequested"].includes(currentRun.status)) return;
    const timer = window.setInterval(() => {
      refreshRuns().catch((reason: Error) => setError(reason.message));
    }, 3000);
    return () => window.clearInterval(timer);
  }, [currentRun, refreshRuns]);

  useEffect(() => {
    if (!experiment || currentRun?.status !== "succeeded") return;
    const controller = new AbortController();
    fetch(`/api/core/experiments/${experiment.id}/runs/${currentRun.runId}/twins`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await messageFrom(response, "Live twins could not be loaded."));
        return (await response.json()) as PipelineTwinResults;
      })
      .then((data) => {
        setResults({ attempt: currentRun.attempt, data });
        setResultsFailure(null);
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") {
          setResultsFailure({ runId: currentRun.runId, attempt: currentRun.attempt, message: reason.message });
        }
      });
    return () => controller.abort();
  }, [currentRun?.runId, currentRun?.status, currentRun?.attempt, experiment]);

  function upsertRun(run: PipelineRun) {
    setRuns((current) => [run, ...current.filter((item) => item.runId !== run.runId)]);
    setSelectedRunId(run.runId);
  }

  async function failedDispatch(response: Response): Promise<PipelineRun | null> {
    if (response.status !== 503) return null;
    const value: unknown = await response.clone().json().catch(() => null);
    if (!value || typeof value !== "object" || !("runId" in value) ||
        typeof value.runId !== "string" || !("stages" in value) ||
        !Array.isArray(value.stages)) return null;
    const run = value as PipelineRun;
    upsertRun(run);
    return run;
  }

  function showDispatchWarning(response: Response) {
    if (response.headers.get("X-Pipeline-Dispatch") === "disabled") {
      setError("The pipeline run was saved, but the Azure runner is not configured. Check the deployment before retrying.");
    }
  }

  async function createExperiment(event: React.FormEvent) {
    event.preventDefault();
    if (!newExperimentName.trim()) return;
    setBusy("create-experiment");
    setError(null);
    const response = await fetch("/api/core/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newExperimentName.trim(), description: "Dashboard pipeline experiment" }),
    });
    setBusy(null);
    if (!response.ok) return setError(await messageFrom(response, "Experiment creation failed."));
    const value = (await response.json()) as {
      id: string;
      name: string;
      status: string;
      modifiedDateTime: string;
      datasetIds?: string[];
      description?: string;
    };
    onExperimentCreated({
      id: value.id,
      name: value.name,
      status: value.status,
      updatedAt: value.modifiedDateTime,
      dataset: `${value.datasetIds?.length ?? 0} datasets`,
      datasetIds: value.datasetIds ?? [],
      description: value.description,
    });
    setNewExperimentName("");
  }

  async function upload(role: InputRole, file: File) {
    setBusy(`upload-${role}`);
    setError(null);
    const form = new FormData();
    form.set("Name", file.name.replace(/\.[^.]+$/, ""));
    form.set("Description", `${roleLabels[role]} pipeline input`);
    form.set("OmicsType", role);
    form.set("File", file);
    const response = await fetch("/api/core/datasets", { method: "POST", body: form });
    setBusy(null);
    if (!response.ok) return setError(await messageFrom(response, `${roleLabels[role]} upload failed.`));
    const value = (await response.json()) as Record<string, unknown>;
    const dataset = mapDataset(value);
    onDatasetCreated(dataset);
    setSelection((current) => ({ ...current, [role]: dataset.id }));
  }

  async function startRun() {
    if (!experiment || !ready || !confirmed) return;
    setBusy("start");
    setError(null);
    const response = await fetch(`/api/core/experiments/${experiment.id}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        contractVersion: "tcga-mrna-cna-ajcc/1.0",
        inputs: {
          mrnaDatasetId: selection.mrna,
          cnaDatasetId: selection.cna,
          clinicalDatasetId: selection.clinical,
        },
      }),
    });
    setBusy(null);
    if (!response.ok) {
      const failedRun = await failedDispatch(response);
      return setError(failedRun?.error?.message ?? await messageFrom(response, "The pipeline run could not be started."));
    }
    const run = (await response.json()) as PipelineRun;
    upsertRun(run);
    showDispatchWarning(response);
  }

  async function runAction(action: "cancel" | "retry") {
    if (!experiment || !currentRun) return;
    setBusy(action);
    setError(null);
    const response = await fetch(
      `/api/core/experiments/${experiment.id}/runs/${currentRun.runId}/${action}`,
      { method: "POST" },
    );
    setBusy(null);
    if (!response.ok) {
      const failedRun = await failedDispatch(response);
      return setError(failedRun?.error?.message ?? await messageFrom(response, `Run ${action} failed.`));
    }
    const run = (await response.json()) as PipelineRun;
    upsertRun(run);
    showDispatchWarning(response);
  }

  return (
    <>
      <Section title="Experiment">
        <Panel title={experiment?.name ?? "Create your first experiment"} meta={experiment?.status ?? "Required"}>
          <form className={styles.createRow} onSubmit={createExperiment}>
            <label>
              New experiment name
              <input value={newExperimentName} onChange={(event) => setNewExperimentName(event.target.value)} />
            </label>
            <button className={ui.primaryAction} disabled={busy === "create-experiment"} type="submit">
              {busy === "create-experiment" ? "Creating…" : "Create experiment"}
            </button>
          </form>
          {experiment ? (
            <div className={styles.metaRow}>
              <span><b>Experiment ID</b>{experiment.id}</span>
              <span><b>Last updated</b>{new Date(experiment.updatedAt).toLocaleString()}</span>
              <span><b>Linked inputs</b>{experiment.datasetIds?.length ?? 0}</span>
            </div>
          ) : null}
        </Panel>
      </Section>

      {experiment ? (
        <>
          <Section title="Validated inputs">
            <div className={`${ui.grid} ${ui.three}`}>
              {roles.map((role) => (
                <Panel key={role} title={roleLabels[role]} meta={datasetValid(selected[role], role) ? "Valid" : "Required"}>
                  <label>
                    Owned dataset
                    <select
                      value={selection[role]}
                      onChange={(event) => setSelection((current) => ({ ...current, [role]: event.target.value }))}
                    >
                      <option value="">Select a dataset</option>
                      {datasets
                        .filter((dataset) => dataset.omicsType?.toLowerCase() === role)
                        .map((dataset) => (
                          <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                        ))}
                    </select>
                  </label>
                  <label className={styles.fileLabel}>
                    Or upload CSV/TSV
                    <input
                      type="file"
                      accept=".csv,.tsv,text/csv,text/tab-separated-values"
                      disabled={busy === `upload-${role}`}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void upload(role, file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <ul className={styles.validationList}>
                    <li data-ok={Boolean(selected[role]?.sha256)}>Authenticated SHA-256 recorded</li>
                    <li data-ok={["csv", "tsv"].includes(selected[role]?.fileType ?? "")}>CSV or TSV input</li>
                    <li data-ok={selected[role]?.status === "Active"}>Owned active dataset</li>
                  </ul>
                </Panel>
              ))}
            </div>
            <p className={styles.contractNote}>
              Matrix inputs must use <code>patient_id</code>. Clinical input must contain exactly <code>patient_id</code>, <code>ajccPathologicStage</code>, and <code>partition</code>; partition values are <code>train</code> or <code>heldout</code>, with both groups non-empty.
            </p>
          </Section>

          <Section title="Fixed recipe">
            <Panel title="TCGA mRNA + CNA + AJCC" meta="pipeline-recipe/1.0 · read only">
              <ol className={styles.recipe}>
                <li>TCGA primary-tumour harmonisation and identity normalisation</li>
                <li>Training-fitted standard scaling and AJCC four-class labels</li>
                <li>ANOVA top-2 features per modality and FA6 extraction</li>
                <li>One-component centroid SGCCA, final matrices, twins, and live verification</li>
              </ol>
              <label className={styles.confirmation}>
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                I confirm these files contain de-identified research data and no identifiable clinical data.
              </label>
              <button className={ui.primaryAction} disabled={!ready || !confirmed || busy === "start"} onClick={startRun} type="button">
                {busy === "start" ? "Starting…" : "Start fixed pipeline"}
              </button>
            </Panel>
          </Section>

          {error ? <div className={styles.errorBox} role="alert">{error}</div> : null}

          <Section title="Pipeline runs">
            <Panel title="Run history" meta={`${runs.length} run${runs.length === 1 ? "" : "s"}`}>
              {runs.length ? (
                <div className={styles.runToolbar}>
                  <label>
                    Selected run
                    <select value={currentRun?.runId ?? ""} onChange={(event) => setSelectedRunId(event.target.value)}>
                      {runs.map((run) => (
                        <option key={run.runId} value={run.runId}>
                          {run.runId} · {run.status} · attempt {run.attempt}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={styles.actions}>
                    {currentRun && ["queued", "running", "cancellationRequested"].includes(currentRun.status) ? (
                      <button className={ui.button} disabled={busy === "cancel" || currentRun.status === "cancellationRequested"} onClick={() => runAction("cancel")} type="button">Cancel safely</button>
                    ) : null}
                    {currentRun?.retryable ? (
                      <button className={ui.button} disabled={busy === "retry"} onClick={() => runAction("retry")} type="button">
                        {currentRun.status === "succeeded" ? "Verify immutable replay" : "Resume run"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className={ui.muted}>No pipeline has been started for this experiment.</p>
              )}
              {currentRun?.error ? (
                <div className={styles.errorBox}>
                  <b>{currentRun.error.code}</b> — {currentRun.error.message}
                  {currentRun.error.traceId ? <span>Trace: {currentRun.error.traceId}</span> : null}
                </div>
              ) : null}
            </Panel>
            {currentRun ? (
              <div className={styles.stageGrid}>
                {currentRun.stages.map((stage) => (
                  <Panel key={stage.id} title={stage.label} meta={stage.status}>
                    <p className={ui.muted}>{stage.detail ?? "Waiting for the preceding validated stage."}</p>
                    <ProgressBar value={stage.status === "succeeded" ? 100 : stage.status === "running" ? 58 : stage.status === "failed" || stage.status === "cancelled" ? 100 : 0} />
                    {stage.durationMs !== null && stage.durationMs !== undefined ? <small>{(stage.durationMs / 1000).toFixed(1)} s</small> : null}
                  </Panel>
                ))}
              </div>
            ) : null}
          </Section>

          {currentRun?.status === "succeeded" ? (
            <Section title="Run-scoped live digital twins">
              {results?.data.runId === currentRun.runId && results.attempt === currentRun.attempt ? (
                <>
                  <div className={styles.resultSummary}>
                    <span><b>{results.data.liveTwinCount}</b> / {results.data.expectedTwinCount} twins live</span>
                    <span><b>{results.data.liveRelationshipCount}</b> / {results.data.expectedRelationshipCount} relationships live</span>
                    <span><b>{results.data.failures.length}</b> verification failures</span>
                  </div>
                  <RunGraph key={`${currentRun.runId}:${currentRun.attempt}`} results={results.data} />
                </>
              ) : (
                <Panel title="Live verification" meta={resultsFailure?.runId === currentRun.runId && resultsFailure.attempt === currentRun.attempt ? "Unavailable" : "Loading"}>
                  <p className={ui.muted}>
                    {resultsFailure?.runId === currentRun.runId && resultsFailure.attempt === currentRun.attempt
                      ? resultsFailure.message
                      : "Reading only the twin and relationship IDs recorded by this run."}
                  </p>
                </Panel>
              )}
            </Section>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export function mapDataset(value: Record<string, unknown>): DatasetItem {
  const rowCount = typeof value.rowCount === "number" ? value.rowCount : null;
  const columnCount = typeof value.columnCount === "number" ? value.columnCount : null;
  const missing = typeof value.missingValuePercentage === "number" ? value.missingValuePercentage : null;
  return {
    id: String(value.id ?? ""),
    name: String(value.name ?? value.originalFileName ?? "Dataset"),
    type: String(value.omicsType ?? "unknown").toUpperCase(),
    samples: rowCount ?? 0,
    features: columnCount ?? 0,
    updated: String(value.modifiedDateTime ?? value.createdDateTime ?? new Date().toISOString()),
    quality: missing === null ? 0 : Math.max(0, Math.round(100 - missing)),
    omicsType: String(value.omicsType ?? ""),
    fileType: String(value.fileType ?? ""),
    originalFileName: String(value.originalFileName ?? ""),
    sha256: typeof value.sha256 === "string" ? value.sha256 : undefined,
    status: String(value.status ?? ""),
    rowCount,
    columnCount,
    missingValuePercentage: missing,
  };
}
