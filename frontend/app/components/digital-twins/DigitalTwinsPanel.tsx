"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppShell } from "../providers/AppProviders";
import { ApiError } from "../../lib/apiClient";
import { getDtFeatureExtraction, generatePatientDtdl, getPatientDtdl, getPatientTwinsCache } from "../../lib/digitalTwinsApi";
import type { DtGenerateRelationshipsItem, DtGenerateTwinsItem } from "../../lib/digitalTwinsTypes";
import { getFinalSelectedMatrix, listExperimentBlobs } from "../../lib/multiOmicsApi";
import type { Blob } from "../../lib/multiOmicsTypes";
import { ToastModel } from "../../models/toast";
import type { DatasetItem } from "../../types";
import { DatasetSelect } from "../multi-omics/DatasetSelect";
import { Panel } from "../ui/Panel";
import { Section } from "../ui/Section";
import moi from "../multi-omics/MultiOmics.module.css";
import { DIGITAL_TWIN_STEPS, DigitalTwinsStepper } from "./DigitalTwinsStepper";
import { ExtractFeaturesStep } from "./ExtractFeaturesStep";
import { ExtractRelationshipsStep } from "./ExtractRelationshipsStep";
import { GenerateRelationshipsStep } from "./GenerateRelationshipsStep";
import { GenerateTwinsStep } from "./GenerateTwinsStep";
import { PatientDtdlStep } from "./PatientDtdlStep";
import { TwinGraphPanel } from "./TwinGraphPanel";

export function DigitalTwinsPanel({
  experimentId,
  datasets,
  onWorkflowRefresh,
}: {
  experimentId: string;
  datasets: DatasetItem[];
  onWorkflowRefresh: () => void;
}) {
  const { showToast } = useAppShell();
  const [selectedDatasetId, setDatasetId] = useState(datasets[0]?.id ?? "");
  const datasetId = selectedDatasetId || datasets[0]?.id || "";
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [selectedBlobIds, setSelectedBlobIds] = useState<string[]>([]);
  const [moiFinalIds, setMoiFinalIds] = useState<string[]>([]);
  const [processedBlobId, setProcessedBlobId] = useState("");
  const [hasFeatures, setHasFeatures] = useState(false);
  const [hasDtdl, setHasDtdl] = useState(false);
  const [twinsItem, setTwinsItem] = useState<DtGenerateTwinsItem | null>(null);
  const [relationshipsItem, setRelationshipsItem] = useState<DtGenerateRelationshipsItem | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [graphRefreshKey, setGraphRefreshKey] = useState(0);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  const notifyError = useCallback(
    (message: string) => {
      showToast(new ToastModel({ title: "Digital twin error", description: message, status: "error" }));
    },
    [showToast],
  );

  const notify = useCallback(
    (title: string, description: string) => {
      showToast(new ToastModel({ title, description, status: "success" }));
    },
    [showToast],
  );

  const refreshBlobs = useCallback(async () => {
    try {
      const [inventory, finals] = await Promise.all([
        listExperimentBlobs(experimentId),
        getFinalSelectedMatrix(experimentId),
      ]);
      setBlobs(inventory);
      const finalIds = finals
        .map((item) => item.finalSelectedMatrixBlobId)
        .filter((id): id is string => Boolean(id));
      setMoiFinalIds(finalIds);
      setSelectedBlobIds((prev) => (prev.length > 0 ? prev : finalIds));
      setProcessedBlobId((prev) => prev || finalIds[0] || "");
    } catch (err) {
      notifyError(err instanceof ApiError ? err.message : "Could not load experiment blobs.");
    }
  }, [experimentId, notifyError]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshBlobs(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshBlobs]);

  const ensureDtdl = useCallback(async () => {
    try {
      await generatePatientDtdl(experimentId);
      setHasDtdl(true);
    } catch (err) {
      notifyError(err instanceof ApiError ? err.message : "Could not create the Patient DTDL model.");
    }
  }, [experimentId, notifyError]);

  useEffect(() => {
    void (async () => {
      try {
        const [features, dtdl, twins] = await Promise.all([
          getDtFeatureExtraction(experimentId),
          getPatientDtdl(experimentId),
          getPatientTwinsCache(experimentId),
        ]);
        setHasFeatures(Boolean(features));
        setHasDtdl(Boolean(dtdl));
        setTwinsItem(twins);
        if (features && !dtdl) await ensureDtdl();
      } catch {
        /* GET 404s are handled in the client */
      }
    })();
  }, [ensureDtdl, experimentId]);

  const unlockedThrough = useMemo(() => {
    let max = 0;
    if (hasFeatures) max = Math.max(max, 2);
    if (twinsItem) max = Math.max(max, 3);
    if (relationshipsItem) max = Math.max(max, 4);
    if (twinsItem) max = Math.max(max, 5);
    return max;
  }, [hasFeatures, relationshipsItem, twinsItem]);

  const scrollToStep = (step: number) => {
    setActiveStep(step);
    stepRefs.current[step]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Section title="Digital twins">
      <p className={moi.dropzoneHint}>
        Twins consume MOI <b>final selected matrices</b> (CSV with a <code>patient_id</code> column and numeric
        features). Extract features, then generate twins — the Patient DTDL model is created automatically
        (already-exists is OK).
      </p>
      {moiFinalIds.length > 0 ? (
        <p className={moi.timestamp}>MOI final matrix blobs: {moiFinalIds.join(", ")}</p>
      ) : (
        <p className={moi.dropzoneHint}>
          No MOI final selected matrix found yet. Finish Experiment step 7 or pick blobs below.
        </p>
      )}
      {blobs.length === 0 ? (
        <p className={moi.dropzoneHint}>
          No experiment blobs yet. Complete multi-omics (final selected matrix) on the Experiment page first.
        </p>
      ) : null}
      <DatasetSelect datasets={datasets} value={datasetId} onChange={setDatasetId} />
      <div className={moi.workflowLayout}>
        <DigitalTwinsStepper activeStep={activeStep} unlockedThrough={unlockedThrough} onStepClick={scrollToStep} />
        <div className={moi.stepsColumn}>
          {DIGITAL_TWIN_STEPS.map((step) => (
            <div
              key={step.id}
              ref={(el) => {
                stepRefs.current[step.id] = el;
              }}
              className={moi.stepSection}
            >
              <Panel title={`Step ${step.id + 1}: ${step.label}`}>
                {step.id === 0 ? (
                  <ExtractFeaturesStep
                    experimentId={experimentId}
                    datasetId={datasetId}
                    blobs={blobs}
                    selectedBlobIds={selectedBlobIds}
                    moiFinalIds={moiFinalIds}
                    onSelectedBlobIdsChange={setSelectedBlobIds}
                    onComplete={() => setHasFeatures(true)}
                    onExtracted={() => {
                      setHasFeatures(true);
                      void ensureDtdl();
                    }}
                    onError={notifyError}
                    onWorkflowRefresh={onWorkflowRefresh}
                  />
                ) : null}
                {step.id === 1 ? (
                  <PatientDtdlStep
                    experimentId={experimentId}
                    enabled={hasFeatures}
                    onComplete={() => setHasDtdl(true)}
                    onError={notifyError}
                  />
                ) : null}
                {step.id === 2 ? (
                  <GenerateTwinsStep
                    experimentId={experimentId}
                    datasetId={datasetId}
                    selectedBlobIds={selectedBlobIds}
                    enabled={hasFeatures}
                    onComplete={(item) => {
                      setTwinsItem(item);
                      setGraphRefreshKey((value) => value + 1);
                    }}
                    onError={notifyError}
                    onWorkflowRefresh={onWorkflowRefresh}
                  />
                ) : null}
                {step.id === 3 ? (
                  <ExtractRelationshipsStep
                    experimentId={experimentId}
                    datasetId={datasetId}
                    blobs={blobs}
                    processedBlobId={processedBlobId}
                    onProcessedBlobIdChange={setProcessedBlobId}
                    enabled={Boolean(twinsItem)}
                    onComplete={(item) => {
                      setRelationshipsItem(item);
                      setGraphRefreshKey((value) => value + 1);
                    }}
                    onError={notifyError}
                  />
                ) : null}
                {step.id === 4 ? (
                  <GenerateRelationshipsStep
                    experimentId={experimentId}
                    processedBlobId={processedBlobId}
                    enabled={Boolean(relationshipsItem)}
                    onChanged={() => setGraphRefreshKey((value) => value + 1)}
                    onError={notifyError}
                  />
                ) : null}
                {step.id === 5 ? (
                  <TwinGraphPanel
                    experimentId={experimentId}
                    processedBlobId={processedBlobId}
                    refreshKey={graphRefreshKey}
                    onError={notifyError}
                    onToast={notify}
                  />
                ) : null}
              </Panel>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
