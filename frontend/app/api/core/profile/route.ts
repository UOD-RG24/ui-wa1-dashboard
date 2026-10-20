import { forwardCore } from "../../../lib/coreApi.server";

export function GET(request: Request) {
  return forwardCore(request, "/auth/status");
}
