import { clearAuthSession, getAccessToken } from "./authStorage";
import type { ApiErrorBody } from "./apiTypes";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");

/** Multipart uploads bypass Next's /api rewrite — it buffers bodies and breaks large files. */
function directBffBase(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_BFF_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:3001";
  }
  return null;
}

function isFormDataBody(body: ApiFetchOptions["body"]): boolean {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function resolveApiBase(body: ApiFetchOptions["body"]): string {
  if (isFormDataBody(body)) {
    const direct = directBffBase();
    if (direct) return direct;
  }
  return API_BASE;
}

function buildUrl(path: string, base: string): string {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const TOAST_MESSAGE_MAX = 280;

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("<") || /<!DOCTYPE/i.test(trimmed) || /<html[\s>]/i.test(trimmed);
}

function titleFromHtml(html: string): string | undefined {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  return title?.replace(/\s+/g, " ").trim() || undefined;
}

function clampMessage(text: string, max = TOAST_MESSAGE_MAX): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, Math.max(0, max - 1))}…`;
}

function errorMessageFromBody(parsed: unknown, status: number, statusText: string): string {
  if (parsed && typeof parsed === "object" && "message" in parsed) {
    const msg = (parsed as ApiErrorBody).message;
    if (typeof msg === "string" && msg.trim()) {
      if (looksLikeHtml(msg)) {
        const title = titleFromHtml(msg);
        return clampMessage(title ? `Request failed (${status}): ${title}` : `Request failed (${status})`);
      }
      return clampMessage(msg);
    }
  }
  if (typeof parsed === "string" && parsed.trim()) {
    if (looksLikeHtml(parsed)) {
      const title = titleFromHtml(parsed);
      return clampMessage(title ? `Request failed (${status}): ${title}` : `Request failed (${status})`);
    }
    return clampMessage(parsed);
  }
  return clampMessage(statusText || `Request failed (${status})`);
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | object | null;
  auth?: boolean;
  skipJson?: boolean;
};

function resolveBody(body: ApiFetchOptions["body"], headers: Headers): BodyInit | undefined {
  if (body == null) return undefined;
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return body;
  }
  if (typeof body === "object" && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
    headers.set("Content-Type", "application/json");
    return JSON.stringify(body);
  }
  return body as BodyInit;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const useAuth = options.auth !== false;

  if (useAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const body = resolveBody(options.body, headers);
  const response = await fetch(buildUrl(path, resolveApiBase(options.body)), {
    ...options,
    headers,
    body,
  });

  if (response.status === 401 && useAuth) {
    clearAuthSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
  }

  if (!response.ok) {
    const raw = await response.text();
    let parsed: unknown = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw;
      }
    }
    const message = errorMessageFromBody(parsed, response.status, response.statusText);
    throw new ApiError(message, response.status, parsed);
  }

  if (response.status === 204 || options.skipJson) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function apiFetchBlob(path: string, options: ApiFetchOptions = {}): Promise<Blob> {
  const headers = new Headers(options.headers);
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers,
    body: resolveBody(options.body, headers),
  });

  if (response.status === 401) {
    clearAuthSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.assign("/login");
    }
  }

  if (!response.ok) {
    throw new ApiError(response.statusText || "Download failed", response.status, null);
  }

  return response.blob();
}
