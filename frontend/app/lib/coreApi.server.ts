import { getToken } from "next-auth/jwt";

function upstreamBase() {
  const raw = process.env.CORE_API_BASE_URL?.replace(/\/$/, "");
  if (!raw) throw new Error("CORE_API_BASE_URL is not configured");
  const url = new URL(raw);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("CORE_API_BASE_URL must use HTTPS in production");
  }
  return raw;
}

export async function coreAccessToken(request: Request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const token = await getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  });
  return typeof token?.coreAccessToken === "string" ? token.coreAccessToken : null;
}

export async function forwardCore(
  request: Request,
  path: string,
  init: RequestInit & { duplex?: "half" } = {},
) {
  const token = await coreAccessToken(request);
  if (!token) return Response.json({ message: "Authentication is required." }, { status: 401 });
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  const response = await fetch(`${upstreamBase()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const responseHeaders = new Headers();
  const contentType = response.headers.get("content-type");
  const location = response.headers.get("location");
  const dispatch = response.headers.get("x-pipeline-dispatch");
  if (contentType) responseHeaders.set("content-type", contentType);
  if (location) responseHeaders.set("location", location);
  if (dispatch) responseHeaders.set("x-pipeline-dispatch", dispatch);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export function jsonBody(request: Request) {
  return request.text();
}
