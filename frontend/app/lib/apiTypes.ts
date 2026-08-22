export type ApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  signupDateTime?: string;
  status: string;
  role: string;
};

export type AuthStatusResponse = {
  isSignedIn: boolean;
  user?: ApiUser;
  message?: string;
};

export type SignInResponse = {
  message: string;
  accessToken: string;
  user: ApiUser;
};

export type SignUpResponse = {
  message: string;
  user: ApiUser;
};

export type ExperimentSection = {
  status: string;
  startedDateTime?: string | null;
  completedDateTime?: string | null;
  lastUpdatedDateTime?: string | null;
  processingTimeMs?: number | null;
  notes?: string | null;
};

export type ApiExperiment = {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  createdDateTime: string;
  modifiedDateTime: string;
  lastAccessedDateTime?: string | null;
  lastUpdatedDateTime?: string | null;
  status: string;
  preprocessing: ExperimentSection;
  multiOmicsIntegration: ExperimentSection;
  training: ExperimentSection;
  evaluation: ExperimentSection;
  digitalTwin: ExperimentSection;
  isDeleted: boolean;
};

export type ApiDataset = {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  omicsType: string;
  fileType: string;
  originalFileName: string;
  storedFileName: string;
  fileSizeBytes: number;
  contentType?: string | null;
  rowCount?: number | null;
  columnCount?: number | null;
  missingValuePercentage?: number | null;
  createdDateTime: string;
  modifiedDateTime: string;
  status: string;
};

export type CreateExperimentBody = {
  name: string;
  description?: string;
};

export type UpdateDatasetBody = {
  name?: string;
  description?: string;
  omicsType?: string;
};

export type ApiErrorBody = {
  message?: string;
};
