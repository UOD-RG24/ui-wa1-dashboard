import { forwardCore } from "../../../lib/coreApi.server";

export const runtime = "nodejs";

export function GET(request: Request) {
  return forwardCore(request, "/datasets/get/list");
}

export function POST(request: Request) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    return Response.json({ message: "A multipart dataset upload is required." }, { status: 415 });
  }
  return forwardCore(request, "/datasets/create", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: request.body,
    duplex: "half",
  });
}
