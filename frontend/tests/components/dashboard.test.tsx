import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PipelineShell } from "../../app/components/pipeline/PipelineShell";
import { LoginForm } from "../../app/login/LoginForm";
import type { DatasetItem, Experiment, PipelineRun, PipelineTwinResults } from "../../app/types";
import { LiveExperimentPage } from "../../app/views/live/LiveExperimentPage";

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

const experiment: Experiment = {
  id: "64b000000000000000000001",
  name: "Live cohort",
  dataset: "0 datasets",
  updatedAt: "2026-10-03T10:00:00Z",
  status: "Active",
  datasetIds: [],
};

const datasets: DatasetItem[] = [
  ["64b000000000000000000011", "mRNA", "mrna"],
  ["64b000000000000000000012", "CNA", "cna"],
  ["64b000000000000000000013", "Clinical", "clinical"],
].map(([id, name, omicsType]) => ({
  id,
  name,
  omicsType,
  type: omicsType.toUpperCase(),
  samples: 16,
  features: 4,
  updated: "2026-10-03T10:00:00Z",
  quality: 100,
  fileType: "csv",
  sha256: "a".repeat(64),
  status: "Active",
}));

function pipelineRun(status: PipelineRun["status"], attempt = 1): PipelineRun {
  return {
    runId: "run_20261020_12345678",
    experimentId: experiment.id,
    contractVersion: "tcga-mrna-cna-ajcc/1.0",
    recipeVersion: "pipeline-recipe/1.0",
    inputs: {
      mrnaDatasetId: datasets[0].id,
      cnaDatasetId: datasets[1].id,
      clinicalDatasetId: datasets[2].id,
    },
    status,
    stages: [],
    attempt,
    retryable: true,
    outputs: { artifactIds: {}, blobIds: {}, twinCount: 0, relationshipCount: 0 },
    error: status === "failed"
      ? { code: "jobDispatchFailed", message: "The pipeline worker could not be started.", retryable: true }
      : null,
    createdAt: "2026-10-20T10:00:00Z",
    updatedAt: "2026-10-20T10:00:00Z",
  };
}

describe("dashboard live and demo boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));
  });

  it("shows an explicit persistent banner only for demo records", () => {
    const props = {
      experiments: [experiment],
      datasets,
      mainView: "experiment" as const,
      selectedExperimentId: experiment.id,
      selectedDatasetId: datasets[0].id,
      isCollapsed: false,
      onToggleCollapsed: vi.fn(),
      onSelectExperiment: vi.fn(),
      onSelectDataset: vi.fn(),
      onSelectProfile: vi.fn(),
      onSignOut: vi.fn(),
      children: <div>content</div>,
    };
    const { rerender } = render(<PipelineShell {...props} demoMode />);
    expect(screen.getByText("Demo data")).toBeInTheDocument();
    rerender(<PipelineShell {...props} demoMode={false} />);
    expect(screen.queryByText("Demo data")).not.toBeInTheDocument();
  });

  it("exposes local credentials only when the explicit development mode is enabled", () => {
    const { rerender } = render(<LoginForm microsoftEnabled localEnabled={false} />);
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
    rerender(<LoginForm microsoftEnabled={false} localEnabled />);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("renders the three validated slots and gates start on de-identification", async () => {
    render(
      <LiveExperimentPage
        experiment={experiment}
        datasets={datasets}
        onDatasetCreated={vi.fn()}
        onExperimentCreated={vi.fn()}
      />,
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText("mRNA expression")).toBeInTheDocument();
    expect(screen.getByText("Copy-number alteration")).toBeInTheDocument();
    expect(screen.getByText("Clinical labels and split")).toBeInTheDocument();
    const start = screen.getByRole("button", { name: "Start fixed pipeline" });
    expect(start).toBeDisabled();
    const selects = screen.getAllByLabelText("Owned dataset");
    fireEvent.change(selects[0], { target: { value: datasets[0].id } });
    fireEvent.change(selects[1], { target: { value: datasets[1].id } });
    fireEvent.change(selects[2], { target: { value: datasets[2].id } });
    fireEvent.click(screen.getByLabelText(/I confirm these files contain de-identified research data/));
    expect(start).toBeEnabled();
  });

  it("keeps a saved 503 dispatch failure visible and retryable", async () => {
    const failed = pipelineRun("failed");
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === "POST"
        ? new Response(JSON.stringify(failed), { status: 503, headers: { "Content-Type": "application/json" } })
        : new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }),
    ));
    render(
      <LiveExperimentPage experiment={experiment} datasets={datasets}
        onDatasetCreated={vi.fn()} onExperimentCreated={vi.fn()} />,
    );
    const selects = screen.getAllByLabelText("Owned dataset");
    datasets.forEach((dataset, index) => fireEvent.change(selects[index], { target: { value: dataset.id } }));
    fireEvent.click(screen.getByLabelText(/I confirm these files contain de-identified research data/));
    fireEvent.click(screen.getByRole("button", { name: "Start fixed pipeline" }));
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /failed · attempt 1/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Resume run" })).toBeInTheDocument();
    });
    expect(screen.getAllByText("The pipeline worker could not be started.")).not.toHaveLength(0);
  });

  it("does not show a previous attempt's twins when replay verification fails", async () => {
    const run = pipelineRun("succeeded");
    const twins: PipelineTwinResults = {
      runId: run.runId,
      expectedTwinCount: 1,
      liveTwinCount: 1,
      expectedRelationshipCount: 0,
      liveRelationshipCount: 0,
      twins: [],
      relationships: [],
      failures: [],
    };
    let twinReads = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/twins")) {
        twinReads++;
        return twinReads === 1
          ? Response.json(twins)
          : Response.json({ message: "Live readback failed." }, { status: 503 });
      }
      if (url.endsWith("/retry") && init?.method === "POST") {
        return Response.json(pipelineRun("succeeded", 2));
      }
      return Response.json([run]);
    }));
    render(
      <LiveExperimentPage experiment={experiment} datasets={datasets}
        onDatasetCreated={vi.fn()} onExperimentCreated={vi.fn()} />,
    );
    expect(await screen.findByText(/twins live/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Verify immutable replay" }));
    expect(await screen.findByText("Live readback failed.")).toBeInTheDocument();
    expect(screen.queryByText(/twins live/)).not.toBeInTheDocument();
  });
});
