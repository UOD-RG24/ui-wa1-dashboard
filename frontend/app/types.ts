export type MainView = "experiment" | "dataset" | "profile" | "twins";

export type PatientNode = {
  id: string;
  cohort: string;
  trainingWeight: number;
  risk: string;
  focus: string;
};

export type Experiment = {
  id: string;
  name: string;
  dataset: string;
  updatedAt: string;
  status: string;
  description?: string;
  datasetIds?: string[];
  blobIds?: string[];
};

export type DatasetItem = {
  id: string;
  name: string;
  type: string;
  samples: number;
  features: number;
  updated: string;
  quality: number;
  omicsType?: "mrna" | "cna" | "clinical" | string;
  fileType?: string;
  originalFileName?: string;
  sha256?: string;
  status?: string;
  rowCount?: number | null;
  columnCount?: number | null;
  missingValuePercentage?: number | null;
};

export type PipelineRunStatus =
  | "queued"
  | "running"
  | "cancellationRequested"
  | "cancelled"
  | "succeeded"
  | "failed";

export type PipelineStageStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "skipped";

export type PipelineStage = {
  id: string;
  label: string;
  status: PipelineStageStatus;
  detail?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
};

export type PipelineRun = {
  runId: string;
  experimentId: string;
  contractVersion: string;
  recipeVersion: string;
  inputs: {
    mrnaDatasetId: string;
    cnaDatasetId: string;
    clinicalDatasetId: string;
  };
  status: PipelineRunStatus;
  currentStage?: string | null;
  stages: PipelineStage[];
  attempt: number;
  retryable: boolean;
  outputs: {
    artifactIds: Record<string, string>;
    blobIds: Record<string, string>;
    twinCount: number;
    relationshipCount: number;
    acceptanceSha256?: string | null;
  };
  error?: {
    code: string;
    message: string;
    traceId?: string | null;
    retryable: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type PipelineTwinResults = {
  runId: string;
  expectedTwinCount: number;
  liveTwinCount: number;
  expectedRelationshipCount: number;
  liveRelationshipCount: number;
  twins: Array<Record<string, unknown>>;
  relationships: Array<Record<string, unknown>>;
  failures: Array<Record<string, unknown>>;
};

export type OmicsLayerKey = "dnaMethylation" | "transcriptomics" | "proteomics";

export type OmicsMatrixRow = {
  feature: string;
  sampleA: number;
  sampleB: number;
  sampleC: number;
  cohort: string;
};

export type WorkflowStep = {
  id: string;
  label: string;
  status: "Complete" | "Running" | "Pending" | "Review";
  detail: string;
};

export type ProfileRecord = {
  name: string;
  email: string;
  role: string;
  workspace: string;
};

export type ActivityLogEntry = {
  time: string;
  agent: string;
  action: string;
  input: string;
  output: string;
  duration: string;
};

export type Message = {
  from: "user" | "agent";
  text: string;
};
