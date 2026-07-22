export type MainView = "experiment" | "dataset" | "profile";

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
};

export type DatasetItem = {
  id: string;
  name: string;
  type: string;
  samples: number;
  features: number;
  updated: string;
  quality: number;
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
