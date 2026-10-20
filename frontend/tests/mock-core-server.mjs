import { createServer } from "node:http";

const experimentId = "64b000000000000000000001";
const ids = {
  mrna: "64b000000000000000000011",
  cna: "64b000000000000000000012",
  clinical: "64b000000000000000000013",
};
let runStatus = "queued";
let polls = 0;

const stageDefinitions = [
  ["uploads", "Uploads"], ["fa3", "FA3"], ["fa2", "FA2"], ["fa1", "FA1"],
  ["fa5", "FA5"], ["fa4", "FA4"], ["fa6", "FA6"], ["handoffImport", "Handoff Import"],
  ["designMatrices", "Design Matrices"], ["sgcca", "SGCCA"], ["finalMatrices", "Final Matrices"],
  ["digitalTwins", "Digital Twins"], ["liveVerification", "Live Verification"],
];

function run() {
  return {
    runId: "run_20261003_mock",
    experimentId,
    contractVersion: "tcga-mrna-cna-ajcc/1.0",
    recipeVersion: "pipeline-recipe/1.0",
    inputs: { mrnaDatasetId: ids.mrna, cnaDatasetId: ids.cna, clinicalDatasetId: ids.clinical },
    status: runStatus,
    currentStage: runStatus === "running" ? "fa3" : null,
    stages: stageDefinitions.map(([id, label], index) => ({
      id,
      label,
      status: runStatus === "succeeded" || index === 0 ? "succeeded" : runStatus === "running" && index === 1 ? "running" : "pending",
      detail: runStatus === "succeeded" ? "Verified by mock acceptance service." : null,
      durationMs: runStatus === "succeeded" ? 125 : null,
    })),
    attempt: 1,
    retryable: runStatus === "succeeded" || runStatus === "cancelled" || runStatus === "failed",
    outputs: {
      artifactIds: {}, blobIds: {}, twinCount: runStatus === "succeeded" ? 2 : 0,
      relationshipCount: runStatus === "succeeded" ? 1 : 0,
      acceptanceSha256: runStatus === "succeeded" ? "a".repeat(64) : null,
    },
    error: null,
    createdAt: "2026-10-03T10:00:00Z",
    updatedAt: "2026-10-03T10:00:05Z",
  };
}

function json(response, status = 200) {
  return { status, headers: { "content-type": "application/json" }, body: JSON.stringify(response) };
}

function dataset(id, name, omicsType) {
  return {
    id, name, omicsType, fileType: "csv", originalFileName: `${omicsType}.csv`, sha256: "b".repeat(64),
    rowCount: 16, columnCount: 5, missingValuePercentage: 0, status: "Active",
    createdDateTime: "2026-10-03T09:00:00Z", modifiedDateTime: "2026-10-03T09:00:00Z",
  };
}

createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1:4301");
  let result;
  if (url.pathname === "/health") result = json({ ok: true });
  else if (url.pathname === "/auth/jwt/signin" && request.method === "POST") result = json({
    accessToken: "mock-core-jwt",
    user: { id: "64a000000000000000000001", firstName: "Ada", lastName: "Researcher", email: "ada@example.org", role: "researcher" },
  });
  else if (url.pathname === "/auth/status") result = json({
    isSignedIn: true,
    user: { id: "64a000000000000000000001", firstName: "Ada", lastName: "Researcher", email: "ada@example.org", role: "researcher", status: "active" },
  });
  else if (url.pathname === "/auth/signout") result = json({ message: "signed out" });
  else if (url.pathname === "/experiments/get/list") result = json([{
    id: experimentId, name: "Mock end-to-end cohort", description: "Playwright acceptance", status: "Active",
    modifiedDateTime: "2026-10-03T10:00:00Z", datasetIds: [],
  }]);
  else if (url.pathname === "/datasets/get/list") result = json([
    dataset(ids.mrna, "Mock mRNA", "mrna"),
    dataset(ids.cna, "Mock CNA", "cna"),
    dataset(ids.clinical, "Mock clinical", "clinical"),
  ]);
  else if (url.pathname.endsWith("/pipeline-runs") && request.method === "POST") {
    runStatus = "queued";
    polls = 0;
    result = json(run(), 202);
  } else if (url.pathname.endsWith("/pipeline-runs") && request.method === "GET") {
    if (runStatus === "queued") {
      polls += 1;
      runStatus = polls > 1 ? "succeeded" : "running";
    } else if (runStatus === "running") runStatus = "succeeded";
    result = json([run()]);
  } else if (url.pathname.endsWith("/cancel") && request.method === "POST") {
    runStatus = "cancelled";
    result = json(run(), 202);
  } else if (url.pathname.endsWith("/retry") && request.method === "POST") {
    runStatus = "queued";
    polls = 0;
    result = json(run(), 202);
  } else if (url.pathname.endsWith("/results/twins")) result = json({
    runId: "run_20261003_mock", expectedTwinCount: 2, liveTwinCount: 2,
    expectedRelationshipCount: 1, liveRelationshipCount: 1, failures: [],
    twins: [
      { $dtId: "TCGA-AA-0001", mrna__1: 0.25, cna__1: 1 },
      { $dtId: "TCGA-AA-0002", mrna__1: -0.35, cna__1: -1 },
    ],
    relationships: [{ $relationshipId: "mrna-1", $sourceId: "TCGA-AA-0001", $targetId: "TCGA-AA-0002", $relationshipName: "mrnaRelationship", cosineSimilarity: 0.997 }],
  });
  else result = json({ message: `No mock route for ${request.method} ${url.pathname}` }, 404);
  response.writeHead(result.status, result.headers);
  response.end(result.body);
}).listen(4301, "127.0.0.1");
