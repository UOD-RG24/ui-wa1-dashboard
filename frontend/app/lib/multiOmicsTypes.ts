/** Types derived from openapi.yaml components/schemas — multi-omics integration */

export type BlobType = "experiment" | "image" | "dataset";

export interface Blob {
  id: string;
  userId?: string;
  blobType?: BlobType;
  storageAccountName?: string;
  containerName?: string;
  directoryName?: string;
  fileName?: string;
  extension?: string | null;
  fileSizeBytes?: number;
  createdAt?: string;
  modifiedAt?: string;
}

export interface UpdateExperimentSectionRequest {
  status?: string;
  startedDateTime?: string;
  completedDateTime?: string;
  processingTimeMs?: number;
  notes?: string;
}

export interface FeatureExtractionRequest {
  datasetId: string;
  preprocessedMatrixBlobId: string;
}

export interface CreateDefinedFeatureMatrixRequest {
  datasetId: string;
  preprocessedMatrixBlobId: string;
  definedFeatures: string[];
}

export interface ExtractSGCCAWeightsProcessRequest {
  indexColumn: string;
  nComponents?: number;
  sparsity: [number, number];
  scheme: string;
  scale?: boolean;
}

export interface ExtractSGCCAWeightsRequest {
  datasetId: string;
  designMatrixBlobIds: [string, string];
  weightsProcessRequest: ExtractSGCCAWeightsProcessRequest;
}

export interface ApplySGCCAWeightsRequest {
  datasetId: string;
  sgccaFeatureWeightsBlobId: string;
  designMatrixBlobIds: [string, string];
  weightsProcessRequest: {
    indexColumn: string;
    component: number;
  };
}

export interface CreateFinalSelectedMatrixRequest {
  datasetId: string;
  sgccaFeatureWeightsBlobId: string;
  sgccaFeatureWeightedMatrixBlobId: string;
  weightsProcessRequest: {
    block: string;
    identifierColumn: string;
  };
}

/** Shared process step timing from Design Matrix / Weights services */
export interface ProcessStep {
  step?: string;
  durationMs?: number;
}

/** Feature extraction process info nested in responses */
export interface FeatureExtractionProcessInfo {
  featureCount?: number;
  excludedColumnCount?: number;
  totalColumnCount?: number;
  featureNames?: string[];
  steps?: ProcessStep[];
  [key: string]: unknown;
}

export interface FeatureExtractionItem {
  preprocessedMatrixBlobId?: string;
  designMatrixFeatureExtraction?: FeatureExtractionProcessInfo;
}

export interface DefinedFeatureMatrixProcessInfo {
  rowCount?: number;
  columnCount?: number;
  selectedFeatureCount?: number;
  totalFeatureCount?: number;
  steps?: ProcessStep[];
  [key: string]: unknown;
}

export interface CreateDefinedFeatureMatrixItem {
  preprocessedMatrixBlobId?: string;
  designMatrixBlobId?: string;
  designMatrixDefinedFeatureMatrix?: DefinedFeatureMatrixProcessInfo;
}

export interface BlockDetails {
  patients?: number;
  features?: number;
  [key: string]: unknown;
}

export interface ExtractSGCCAWeightsProcessInfo {
  blockDetails?: Record<string, BlockDetails>;
  weightsExtracted?: number;
  selectedWeights?: number;
  selectedFeatures?: number;
  sparsity?: [number, number];
  steps?: ProcessStep[];
  [key: string]: unknown;
}

export interface ExtractSGCCAWeightsItem {
  designMatrixBlobId1?: string;
  designMatrixBlobId2?: string;
  sgccaWeightsMatrixBlobId?: string;
  extractSGCCAWeights?: ExtractSGCCAWeightsProcessInfo;
}

export interface ApplyWeightsOutput {
  block?: string;
  samplesProcessed?: number;
  featuresWeighted?: number;
  zeroWeightedValues?: number;
  [key: string]: unknown;
}

export interface ApplySGCCAWeightsProcessInfo {
  outputs?: ApplyWeightsOutput[];
  steps?: ProcessStep[];
  [key: string]: unknown;
}

export interface ApplySGCCAWeightsItem {
  designMatrixBlobId1?: string;
  designMatrixBlobId2?: string;
  sgccaFeatureWeightedMatrixBlobId1?: string;
  sgccaFeatureWeightedMatrixBlobId2?: string;
  designMatrixDefinedFeatureMatrix?: ApplySGCCAWeightsProcessInfo;
}

export interface CreateFinalSelectedMatrixProcessInfo {
  rowCount?: number;
  columnCount?: number;
  selectedFeatureCount?: number;
  steps?: ProcessStep[];
  [key: string]: unknown;
}

export interface CreateFinalSelectedMatrixItem {
  finalSelectedMatrixBlobId?: string;
  createFinalSelectedMatrix?: CreateFinalSelectedMatrixProcessInfo;
}

export type RgccaHealthResponse = Record<string, unknown>;
