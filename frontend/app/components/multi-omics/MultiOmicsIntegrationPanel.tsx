"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppShell } from "../providers/AppProviders";
import { ApiError } from "../../lib/apiClient";
import { listExperimentBlobs } from "../../lib/multiOmicsApi";
import type { Blob } from "../../lib/multiOmicsTypes";
import { ToastModel } from "../../models/toast";
import type { DatasetItem } from "../../types";
import { Panel } from "../ui/Panel";
import { Section } from "../ui/Section";
import { BlobInventoryTable } from "./BlobInventoryTable";
import { BlobUploadDropzone } from "./BlobUploadDropzone";
import { DatasetSelect } from "./DatasetSelect";
import { DefinedFeatureMatrixStep } from "./DefinedFeatureMatrixStep";
import { ExtractSgccaWeightsStep } from "./ExtractSgccaWeightsStep";
import { FeatureExtractionStep } from "./FeatureExtractionStep";
import { ApplySgccaWeightsStep } from "./ApplySgccaWeightsStep";
import { FinalSelectedMatrixStep } from "./FinalSelectedMatrixStep";
import { RgccaHealthPanel } from "./RgccaHealthPanel";
import { MULTI_OMICS_STEPS, WorkflowStepper } from "./WorkflowStepper";
import styles from "./MultiOmics.module.css";

export function MultiOmicsIntegrationPanel({
  experimentId,
  datasets,
  onWorkflowRefresh,
}: {
  experimentId: string;
  datasets: DatasetItem[];
  onWorkflowRefresh: () => void;
}) {
  const { showToast } = useAppShell();
  const [datasetId, setDatasetId] = useState(datasets[0]?.id ?? "");
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [hasFeatureExtraction, setHasFeatureExtraction] = useState(false);
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  const [designMatrixBlobIds, setDesignMatrixBlobIds] = useState<string[]>([]);
  const [weightsBlobId, setWeightsBlobId] = useState("");
  const [weightedBlobIds, setWeightedBlobIds] = useState<[string, string] | null>(null);

  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  const notifyError = useCallback(
    (message: string) => {
      showToast(new ToastModel({ title: "Multi-omics error", description: message, status: "error" }));
    },
    [showToast],
  );

  const refreshBlobs = useCallback(async () => {
    try {
      const result = await listExperimentBlobs(experimentId);
      setBlobs(result);
    } catch (err) {
      notifyError(err instanceof ApiError ? err.message : "Could not load blobs.");
    }
  }, [experimentId, notifyError]);

  useEffect(() => {
    void refreshBlobs();
  }, [refreshBlobs]);

  useEffect(() => {
    if (!datasetId && datasets[0]?.id) setDatasetId(datasets[0].id);
  }, [datasetId, datasets]);

  const handleFeatureExtractionComplete = useCallback(() => {
    setHasFeatureExtraction(true);
  }, []);

  const handleDesignMatrixComplete = useCallback((ids: string[]) => {
    setDesignMatrixBlobIds(ids);
  }, []);

  const handleFeaturesLoaded = useCallback((names: string[]) => {
    setAvailableFeatures((prev) => {
      if (prev.length === names.length && prev.length > 0 && prev[0] === names[0]) {
        return prev;
      }
      return names;
    });
  }, []);

  const unlockedThrough = useMemo(() => {
    let max = 0;
    if (blobs.length > 0) max = Math.max(max, 1);
    if (hasFeatureExtraction) max = Math.max(max, 2);
    if (designMatrixBlobIds.length >= 2) max = Math.max(max, 3);
    if (weightsBlobId) max = Math.max(max, 4);
    if (weightedBlobIds) max = Math.max(max, 5);
    if (weightedBlobIds) max = Math.max(max, 6);
    return max;
  }, [blobs.length, designMatrixBlobIds.length, hasFeatureExtraction, weightsBlobId, weightedBlobIds]);

  const scrollToStep = (step: number) => {
    setActiveStep(step);
    stepRefs.current[step]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const designPair: [string, string] | null =
    designMatrixBlobIds.length >= 2 ? [designMatrixBlobIds[0], designMatrixBlobIds[1]] : null;

  return (
    <Section title="Multi-Omics Integration">
      <WorkflowStepper
        activeStep={activeStep}
        unlockedThrough={unlockedThrough}
        onStepClick={scrollToStep}
      />

      <DatasetSelect datasets={datasets} value={datasetId} onChange={setDatasetId} />

      {MULTI_OMICS_STEPS.map((step) => (
        <div
          key={step.id}
          ref={(el) => {
            stepRefs.current[step.id] = el;
          }}
          className={styles.stepSection}
        >
          <Panel title={`Step ${step.id + 1}: ${step.label}`}>
            {step.id === 0 ? (
              <div className={styles.stepContent}>
                <BlobUploadDropzone
                  experimentId={experimentId}
                  onUploaded={() => {
                    void refreshBlobs();
                    showToast(
                      new ToastModel({ title: "Blob uploaded", description: "File added to inventory.", status: "success" }),
                    );
                  }}
                  onError={notifyError}
                />
                <BlobInventoryTable
                  experimentId={experimentId}
                  blobs={blobs}
                  onChanged={() => void refreshBlobs()}
                  onError={notifyError}
                />
              </div>
            ) : null}

            {step.id === 1 ? (
              <RgccaHealthPanel experimentId={experimentId} onError={notifyError} />
            ) : null}

            {step.id === 2 ? (
              <FeatureExtractionStep
                experimentId={experimentId}
                datasetId={datasetId}
                blobs={blobs}
                onComplete={handleFeatureExtractionComplete}
                onFeaturesLoaded={handleFeaturesLoaded}
                onError={notifyError}
                onWorkflowRefresh={onWorkflowRefresh}
              />
            ) : null}

            {step.id === 3 ? (
              <DefinedFeatureMatrixStep
                experimentId={experimentId}
                datasetId={datasetId}
                blobs={blobs}
                availableFeatures={availableFeatures}
                onComplete={handleDesignMatrixComplete}
                onError={notifyError}
                onWorkflowRefresh={onWorkflowRefresh}
              />
            ) : null}

            {step.id === 4 ? (
              <ExtractSgccaWeightsStep
                experimentId={experimentId}
                datasetId={datasetId}
                designMatrixBlobIds={designPair}
                onComplete={setWeightsBlobId}
                onError={notifyError}
                onWorkflowRefresh={onWorkflowRefresh}
              />
            ) : null}

            {step.id === 5 ? (
              <ApplySgccaWeightsStep
                experimentId={experimentId}
                datasetId={datasetId}
                designMatrixBlobIds={designPair}
                weightsBlobId={weightsBlobId}
                onComplete={setWeightedBlobIds}
                onError={notifyError}
                onWorkflowRefresh={onWorkflowRefresh}
              />
            ) : null}

            {step.id === 6 ? (
              <FinalSelectedMatrixStep
                experimentId={experimentId}
                datasetId={datasetId}
                weightsBlobId={weightsBlobId}
                weightedMatrixBlobId={weightedBlobIds?.[0] ?? ""}
                onError={notifyError}
                onWorkflowRefresh={onWorkflowRefresh}
              />
            ) : null}
          </Panel>
        </div>
      ))}
    </Section>
  );
}
