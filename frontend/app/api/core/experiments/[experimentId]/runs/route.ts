import { forwardCore, jsonBody } from "../../../../../lib/coreApi.server";

type Context = { params: Promise<{ experimentId: string }> };

export async function GET(request: Request, context: Context) {
  const { experimentId } = await context.params;
  return forwardCore(request, `/experiments/get/${encodeURIComponent(experimentId)}/pipeline-runs`);
}

export async function POST(request: Request, context: Context) {
  const { experimentId } = await context.params;
  const idempotencyKey = request.headers.get("idempotency-key");
  if (!idempotencyKey) {
    return Response.json({ message: "Idempotency-Key is required." }, { status: 400 });
  }
  return forwardCore(request, `/experiments/get/${encodeURIComponent(experimentId)}/pipeline-runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: await jsonBody(request),
  });
}
