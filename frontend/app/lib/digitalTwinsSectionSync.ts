import { updateExperimentSection } from "./api";

export async function syncDigitalTwinSection(
  experimentId: string,
  status: "NotStarted" | "Running" | "Complete" | "Failed",
  extra?: { processingTimeMs?: number; notes?: string },
) {
  const now = new Date().toISOString();
  const body: {
    status: string;
    startedDateTime?: string;
    completedDateTime?: string;
    processingTimeMs?: number;
    notes?: string;
  } = { status, ...extra };

  if (status === "Running") {
    body.startedDateTime = now;
  }
  if (status === "Complete" || status === "Failed") {
    body.completedDateTime = now;
  }

  await updateExperimentSection(experimentId, "digital-twin", body);
}
