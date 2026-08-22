import type { ApiDataset, ApiExperiment, ExperimentSection } from "./apiTypes";
import type { DatasetItem, Experiment, WorkflowStep } from "../types";

function qualityFromMissing(missing?: number | null): number {
  if (missing == null || Number.isNaN(missing)) return 100;
  return Math.max(0, Math.min(100, Math.round(100 - missing)));
}

export function mapDataset(api: ApiDataset): DatasetItem {
  return {
    id: api.id,
    name: api.name,
    type: api.omicsType,
    samples: api.rowCount ?? 0,
    features: api.columnCount ?? 0,
    updated: api.modifiedDateTime?.slice(0, 10) ?? "",
    quality: qualityFromMissing(api.missingValuePercentage),
  };
}

export function mapExperiment(api: ApiExperiment): Experiment {
  return {
    id: api.id,
    name: api.name,
    dataset: api.description?.trim() || "—",
    updatedAt: api.modifiedDateTime,
    status: api.status,
  };
}

function mapSectionStatus(status: string): WorkflowStep["status"] {
  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "complete") return "Complete";
  if (normalized === "inprogress" || normalized === "running" || normalized === "in_progress") {
    return "Running";
  }
  if (normalized === "review") return "Review";
  return "Pending";
}

function sectionToStep(
  id: string,
  label: string,
  section: ExperimentSection | undefined,
  fallbackDetail: string,
): WorkflowStep {
  return {
    id,
    label,
    status: mapSectionStatus(section?.status ?? "NotStarted"),
    detail: section?.notes?.trim() || fallbackDetail,
  };
}

export function mapExperimentWorkflow(api: ApiExperiment): WorkflowStep[] {
  return [
    sectionToStep("preprocessing", "Pre-processing", api.preprocessing, "Dataset cleaning and normalisation."),
    sectionToStep(
      "integration",
      "Multi-Omics Integration",
      api.multiOmicsIntegration,
      "Cross-omics feature alignment.",
    ),
    sectionToStep("training", "Training", api.training, "Model training on integrated features."),
    sectionToStep("evaluation", "Evaluation", api.evaluation, "Validation metrics and review."),
    sectionToStep("digitalTwin", "Digital Twin", api.digitalTwin, "Patient-specific twin representations."),
  ];
}
