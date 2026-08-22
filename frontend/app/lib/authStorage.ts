const ACCESS_TOKEN_KEY = "wa1.accessToken";
const USER_KEY = "wa1.user";

import type { ApiUser } from "./apiTypes";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getAccessToken(): string | null {
  return storage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function setAccessToken(token: string): void {
  storage()?.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  storage()?.removeItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser(): ApiUser | null {
  const raw = storage()?.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: ApiUser): void {
  storage()?.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  storage()?.removeItem(USER_KEY);
}

export function clearAuthSession(): void {
  clearAccessToken();
  clearStoredUser();
}
