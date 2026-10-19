import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardShell } from "../../app/components/dashboard/DashboardShell";
import { LoginForm } from "../../app/login/LoginForm";
import type { DatasetItem, Experiment } from "../../app/types";
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
    const { rerender } = render(<DashboardShell {...props} demoMode />);
    expect(screen.getByText("Demo data")).toBeInTheDocument();
    rerender(<DashboardShell {...props} demoMode={false} />);
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
});
