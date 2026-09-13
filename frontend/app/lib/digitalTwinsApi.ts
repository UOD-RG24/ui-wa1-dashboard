import { ApiError, apiFetch } from "./apiClient";
import type { Blob } from "./multiOmicsTypes";
import type {
  AzureDigitalTwin,
  AzureRelationship,
  DigitalTwinsRecord,
  DtExtractFeaturesRequest,
  DtFeatureExtractionItem,
  DtGenerateRelationshipsItem,
  DtGenerateRelationshipsRequest,
  DtGenerateTwinsItem,
  DtGenerateTwinsRequest,
  DtUpdateRelationshipRequest,
  DtUpdateTwinsRequest,
  LiveExportResponse,
  LiveRelationshipsResponse,
  LiveTwinsResponse,
  MessageResponse,
  RelationshipExtractSummary,
  TwinCreateResult,
  TwinRelationshipsResponse,
} from "./digitalTwinsTypes";

const dt = (experimentId: string) => `/experiments/get/${experimentId}/digital-twins`;

const blobs = (experimentId: string) => `/experiments/get/${experimentId}/blobs`;

async function getOrNull<T>(path: string): Promise<T | null> {
  try {
    return await apiFetch<T>(path);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function getExperimentBlob(experimentId: string, blobId: string) {
  return apiFetch<Blob>(`${blobs(experimentId)}/get/${blobId}`);
}

export function generateDtFeatureExtraction(experimentId: string, body: DtExtractFeaturesRequest) {
  return apiFetch<DigitalTwinsRecord>(`${dt(experimentId)}/extract-features/generate`, {
    method: "POST",
    body,
  });
}

export function getDtFeatureExtraction(experimentId: string) {
  return getOrNull<DtFeatureExtractionItem>(`${dt(experimentId)}/extract-features/get`);
}

export async function generatePatientDtdl(experimentId: string) {
  try {
    return await apiFetch<MessageResponse>(`${dt(experimentId)}/patient-dtdl/generate`, {
      method: "POST",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { message: err.message || "The Patient DTDL model already exists.", alreadyExists: true };
    }
    throw err;
  }
}

export function getPatientDtdl(experimentId: string) {
  return getOrNull<Record<string, unknown>>(`${dt(experimentId)}/patient-dtdl/get`);
}

export function deletePatientDtdl(experimentId: string) {
  return apiFetch<MessageResponse>(`${dt(experimentId)}/patient-dtdl/delete`, {
    method: "DELETE",
  });
}

export function generatePatientTwins(experimentId: string, body: DtGenerateTwinsRequest) {
  return apiFetch<TwinCreateResult>(`${dt(experimentId)}/patient-twins/generate`, {
    method: "POST",
    body,
  });
}

export function getPatientTwinsCache(experimentId: string) {
  return getOrNull<DtGenerateTwinsItem>(`${dt(experimentId)}/patient-twins/get/all/cache`);
}

export function getPatientTwinsLive(experimentId: string) {
  return getOrNull<LiveTwinsResponse>(`${dt(experimentId)}/patient-twins/get/all/live`);
}

export function getPatientTwin(experimentId: string, patientId: string) {
  return getOrNull<AzureDigitalTwin>(
    `${dt(experimentId)}/patient-twins/get/twin/${encodeURIComponent(patientId)}`,
  );
}

export function updatePatientTwin(experimentId: string, patientId: string, body: DtUpdateTwinsRequest) {
  return apiFetch<AzureDigitalTwin>(
    `${dt(experimentId)}/patient-twins/get/twin/${encodeURIComponent(patientId)}/update`,
    { method: "PATCH", body },
  );
}

export function deletePatientTwin(experimentId: string, patientId: string) {
  return apiFetch<MessageResponse>(
    `${dt(experimentId)}/patient-twins/get/twin/${encodeURIComponent(patientId)}/delete`,
    { method: "DELETE" },
  );
}

export function deleteAllPatientTwins(experimentId: string) {
  return apiFetch<MessageResponse>(`${dt(experimentId)}/patient-twins/delete-all`, {
    method: "DELETE",
  });
}

export async function exportPatientTwinsLive(experimentId: string) {
  try {
    return await apiFetch<LiveExportResponse>(`${dt(experimentId)}/patient-twins/export/live`, {
      method: "POST",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      const body = err.body as LiveExportResponse | null;
      return {
        message: body?.error ?? err.message,
        alreadyExists: true,
        blobId: body?.existingBlobId ?? body?.existingBlob?.id,
        blob: body?.existingBlob,
      };
    }
    throw err;
  }
}

export function getTwinRelationshipsIncoming(experimentId: string, patientId: string) {
  return getOrNull<TwinRelationshipsResponse>(
    `${dt(experimentId)}/patient-twins/get/twin/${encodeURIComponent(patientId)}/relationships/incoming`,
  );
}

export function getTwinRelationshipsOutgoing(experimentId: string, patientId: string) {
  return getOrNull<TwinRelationshipsResponse>(
    `${dt(experimentId)}/patient-twins/get/twin/${encodeURIComponent(patientId)}/relationships/outgoing`,
  );
}

export function extractPatientRelationships(experimentId: string, body: DtGenerateRelationshipsRequest) {
  return apiFetch<RelationshipExtractSummary>(`${dt(experimentId)}/patient-relationships/extract`, {
    method: "POST",
    body,
  });
}

export function getPatientRelationshipsCache(experimentId: string, processedBlobId: string) {
  return getOrNull<DtGenerateRelationshipsItem>(
    `${dt(experimentId)}/patient-relationships/get/${encodeURIComponent(processedBlobId)}/cache`,
  );
}

export function getPatientRelationshipsLive(experimentId: string, processedBlobId: string) {
  return getOrNull<LiveRelationshipsResponse>(
    `${dt(experimentId)}/patient-relationships/get/${encodeURIComponent(processedBlobId)}/live`,
  );
}

export function generateNamedRelationships(
  experimentId: string,
  processedBlobId: string,
  relationshipName: string,
  max: number,
) {
  return apiFetch<MessageResponse>(
    `${dt(experimentId)}/patient-relationships/get/${encodeURIComponent(processedBlobId)}/generate/${encodeURIComponent(relationshipName)}/max/${max}`,
    { method: "POST" },
  );
}

export function deleteNamedRelationships(
  experimentId: string,
  processedBlobId: string,
  relationshipName: string,
  max: number,
) {
  return apiFetch<MessageResponse>(
    `${dt(experimentId)}/patient-relationships/get/${encodeURIComponent(processedBlobId)}/delete/${encodeURIComponent(relationshipName)}/max/${max}`,
    { method: "DELETE" },
  );
}

export function getPatientRelationship(experimentId: string, sourceTwinId: string, relationshipId: string) {
  return getOrNull<AzureRelationship>(
    `${dt(experimentId)}/patient-relationships/get/${encodeURIComponent(sourceTwinId)}/${encodeURIComponent(relationshipId)}`,
  );
}

export function updatePatientRelationship(
  experimentId: string,
  sourceTwinId: string,
  relationshipId: string,
  body: DtUpdateRelationshipRequest,
) {
  return apiFetch<AzureRelationship>(
    `${dt(experimentId)}/patient-relationships/get/${encodeURIComponent(sourceTwinId)}/${encodeURIComponent(relationshipId)}/update`,
    { method: "PATCH", body },
  );
}

export function deletePatientRelationship(experimentId: string, sourceTwinId: string, relationshipId: string) {
  return apiFetch<void>(
    `${dt(experimentId)}/patient-relationships/get/${encodeURIComponent(sourceTwinId)}/${encodeURIComponent(relationshipId)}/delete`,
    { method: "DELETE", skipJson: true },
  );
}

export async function exportPatientRelationshipsLive(experimentId: string) {
  try {
    return await apiFetch<LiveExportResponse>(`${dt(experimentId)}/patient-relationships/export/live`, {
      method: "POST",
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      const body = err.body as LiveExportResponse | null;
      return {
        message: body?.error ?? err.message,
        alreadyExists: true,
        blobId: body?.existingBlobId ?? body?.existingBlob?.id,
        blob: body?.existingBlob,
      };
    }
    throw err;
  }
}
