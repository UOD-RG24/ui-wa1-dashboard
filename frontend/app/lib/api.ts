import { apiFetch, apiFetchBlob } from "./apiClient";
import type {
  ApiDataset,
  ApiExperiment,
  AuthStatusResponse,
  CreateExperimentBody,
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
