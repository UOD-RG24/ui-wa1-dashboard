import { forwardCore, jsonBody } from "../../../lib/coreApi.server";

export function GET(request: Request) {
  return forwardCore(request, "/experiments/get/list");
}

export async function POST(request: Request) {
  return forwardCore(request, "/experiments/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await jsonBody(request),
  });
}
