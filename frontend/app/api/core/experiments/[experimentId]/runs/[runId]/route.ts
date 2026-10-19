import { forwardCore } from "../../../../../../lib/coreApi.server";

type Context = { params: Promise<{ experimentId: string; runId: string }> };

export async function GET(request: Request, context: Context) {
  const { experimentId, runId } = await context.params;
  return forwardCore(
    request,
    `/experiments/get/${encodeURIComponent(experimentId)}/pipeline-runs/${encodeURIComponent(runId)}`,
  );
}
