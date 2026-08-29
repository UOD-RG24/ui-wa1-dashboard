import { apiFetch } from "./apiClient";
import type {
  ApplySGCCAWeightsItem,
  ApplySGCCAWeightsRequest,
  Blob,
  CreateDefinedFeatureMatrixItem,
  CreateDefinedFeatureMatrixRequest,
  CreateFinalSelectedMatrixItem,
  CreateFinalSelectedMatrixRequest,
  ExtractSGCCAWeightsItem,
  ExtractSGCCAWeightsRequest,
  FeatureExtractionItem,
  FeatureExtractionRequest,
  RgccaHealthResponse,
} from "./multiOmicsTypes";

const moi = (experimentId: string) =>
  `/experiments/get/${experimentId}/multi-omics-integration`;

const blobs = (experimentId: string) => `/experiments/get/${experimentId}/blobs`;

export function uploadExperimentBlob(experimentId: string, file: File) {
  const form = new FormData();
  form.append("File", file);
  return apiFetch<Blob>(`${blobs(experimentId)}/upload`, {
    method: "POST",
    body: form,
  });
}

export function listExperimentBlobs(experimentId: string) {
  return apiFetch<Blob[]>(`${blobs(experimentId)}/read-all`);
}

export function deleteExperimentBlob(experimentId: string, blobId: string) {
  return apiFetch<void>(`${blobs(experimentId)}/delete/${blobId}`, {
    method: "DELETE",
    skipJson: true,
  });
}

export function getRgccaHealth(experimentId: string) {
  return apiFetch<RgccaHealthResponse>(`${moi(experimentId)}/rgcca-health/get`);
}

export function getFeatureExtraction(experimentId: string) {
  return apiFetch<FeatureExtractionItem[]>(
    `${moi(experimentId)}/design-matrix/feature-extraction/get`,
  );
}

export function generateFeatureExtraction(experimentId: string, body: FeatureExtractionRequest) {
  return apiFetch<Record<string, unknown>>(
    `${moi(experimentId)}/design-matrix/feature-extraction/generate`,
    { method: "POST", body },
  );
}

export function getDefinedFeatureMatrix(experimentId: string) {
  return apiFetch<CreateDefinedFeatureMatrixItem[]>(
    `${moi(experimentId)}/design-matrix/create_defined_feature_matrix/get`,
  );
}

export function generateDefinedFeatureMatrix(
  experimentId: string,
  body: CreateDefinedFeatureMatrixRequest,
) {
  return apiFetch<Record<string, unknown>>(
    `${moi(experimentId)}/design-matrix/create_defined_feature_matrix/generate`,
    { method: "POST", body },
  );
}

export function getExtractSgccaWeights(experimentId: string) {
  return apiFetch<ExtractSGCCAWeightsItem[]>(
    `${moi(experimentId)}/weights/extract-sgcca-weights/get`,
  );
}

export function generateExtractSgccaWeights(
  experimentId: string,
  body: ExtractSGCCAWeightsRequest,
) {
  return apiFetch<Record<string, unknown>>(
    `${moi(experimentId)}/weights/extract-sgcca-weights/generate`,
    { method: "POST", body },
  );
}

export function getApplySgccaWeights(experimentId: string) {
  return apiFetch<ApplySGCCAWeightsItem[]>(
    `${moi(experimentId)}/weights/apply-sgcca-weights/get`,
  );
}

export function generateApplySgccaWeights(experimentId: string, body: ApplySGCCAWeightsRequest) {
  return apiFetch<Record<string, unknown>>(
    `${moi(experimentId)}/weights/apply-sgcca-weights/generate`,
    { method: "POST", body },
  );
}

export function getFinalSelectedMatrix(experimentId: string) {
  return apiFetch<CreateFinalSelectedMatrixItem[]>(
    `${moi(experimentId)}/weights/create-final-selected-matrix/get`,
  );
}

export function generateFinalSelectedMatrix(
  experimentId: string,
  body: CreateFinalSelectedMatrixRequest,
) {
  return apiFetch<Record<string, unknown>>(
    `${moi(experimentId)}/weights/create-final-selected-matrix/generate`,
    { method: "POST", body },
  );
}
