import { ApiError, apiFetch, apiFetchBlob } from "./apiClient";
import type {
  ApiDataset,
  ApiExperiment,
  AuthStatusResponse,
  CreateExperimentBody,
  MicrosoftStatusResponse,
  SignInResponse,
  SignUpResponse,
  UpdateDatasetBody,
} from "./apiTypes";

export function signUp(body: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  return apiFetch<SignUpResponse>("/auth/jwt/signup", {
    method: "POST",
    body,
    auth: false,
  });
}

export function signIn(body: { email: string; password: string }) {
  return apiFetch<SignInResponse>("/auth/jwt/signin", {
    method: "POST",
    body,
    auth: false,
  });
}

export function getAuthStatus() {
  return apiFetch<AuthStatusResponse>("/auth/status");
}

export function signOut() {
  return apiFetch<{ message: string }>("/auth/signout", { method: "POST" });
}

/**
 * Exchange a Microsoft Entra access token for the API LocalJwt.
 * Uses core-compatible microsoft status/signup/signin paths (works via Nest BFF or direct core rewrite).
 * Prefer Nest `POST /auth/microsoft/exchange` when the BFF is available; fall back on 404.
 */
export async function exchangeMicrosoftToken(microsoftAccessToken: string) {
  const headers = { Authorization: `Bearer ${microsoftAccessToken}` };

  try {
    return await apiFetch<SignInResponse>("/auth/microsoft/exchange", {
      method: "POST",
      auth: false,
      headers,
    });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 404) {
      throw err;
    }
  }

  const status = await apiFetch<MicrosoftStatusResponse>("/auth/microsoft/status", {
    method: "GET",
    auth: false,
    headers,
  });

  if (!status.registered) {
    try {
      await apiFetch<SignUpResponse>("/auth/microsoft/signup", {
        method: "POST",
        auth: false,
        headers,
      });
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 409) {
        throw err;
      }
    }
  }

  return apiFetch<SignInResponse>("/auth/microsoft/signin", {
    method: "POST",
    auth: false,
    headers,
  });
}

export function listDatasets() {
  return apiFetch<ApiDataset[]>("/datasets/get/list");
}

export function getDataset(id: string) {
  return apiFetch<ApiDataset>(`/datasets/get/${id}`);
}

export function createDataset(form: FormData) {
  return apiFetch<ApiDataset>("/datasets/create", {
    method: "POST",
    body: form,
  });
}

export function updateDataset(id: string, body: UpdateDatasetBody) {
  return apiFetch<void>(`/datasets/update/${id}`, {
    method: "PUT",
    body,
    skipJson: true,
  });
}

export function deleteDataset(id: string) {
  return apiFetch<void>(`/datasets/delete/${id}`, {
    method: "DELETE",
    skipJson: true,
  });
}

export function downloadDataset(id: string) {
  return apiFetchBlob(`/datasets/download/${id}`);
}

export function listExperiments() {
  return apiFetch<ApiExperiment[]>("/experiments/get/list");
}

export function getExperiment(id: string) {
  return apiFetch<ApiExperiment>(`/experiments/get/${id}`);
}

export function createExperiment(body: CreateExperimentBody) {
  return apiFetch<ApiExperiment>("/experiments/create", {
    method: "POST",
    body,
  });
}

export function deleteExperiment(id: string) {
  return apiFetch<void>(`/experiments/delete/${id}`, {
    method: "DELETE",
    skipJson: true,
  });
}

export function updateExperimentSection(
  experimentId: string,
  section: "preprocessing" | "multi-omics-integration" | "training" | "evaluation" | "digital-twin",
  body: {
    status?: string;
    startedDateTime?: string;
    completedDateTime?: string;
    processingTimeMs?: number;
    notes?: string;
  },
) {
  return apiFetch<void>(`/experiments/update/${experimentId}/${section}`, {
    method: "PUT",
    body,
    skipJson: true,
  });
}
