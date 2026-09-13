"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ApiError } from "../../lib/apiClient";
import {
  deleteAllPatientTwins,
  deletePatientRelationship,
  deletePatientTwin,
  exportPatientRelationshipsLive,
  exportPatientTwinsLive,
  getPatientRelationshipsCache,
  getPatientRelationshipsLive,
  getPatientTwin,
  getPatientTwinsCache,
  getPatientTwinsLive,
  getTwinRelationshipsIncoming,
  getTwinRelationshipsOutgoing,
  updatePatientRelationship,
  updatePatientTwin,
} from "../../lib/digitalTwinsApi";
import {
  graphEdgesFromCache,
  graphEdgesFromLive,
  graphNodesFromLive,
  graphNodesFromRows,
  relationshipCosineFrom,
  relationshipIdFrom,
  relationshipSourceFrom,
  relationshipTargetFrom,
  relationshipsFromTwinResponse,
  twinIdFrom,
  twinPropertiesFrom,
} from "../../lib/digitalTwinsMappers";
import type { AzureDigitalTwin, AzureRelationship, GraphRelationshipEdge, GraphTwinNode } from "../../lib/digitalTwinsTypes";
import { useExperimentStepLoad, useLatestRef } from "../multi-omics/useExperimentStepLoad";
import { Panel } from "../ui/Panel";
import moi from "../multi-omics/MultiOmics.module.css";
import ui from "../ui/Ui.module.css";
import pageStyles from "../../views/TwinsPage.module.css";
import dt from "./DigitalTwins.module.css";

function layoutNodes(twins: GraphTwinNode[]): Node[] {
  const count = Math.max(twins.length, 1);
  const radius = Math.min(280, 90 + twins.length * 14);
  return twins.map((twin, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      id: twin.id,
      position: { x: 320 + Math.cos(angle) * radius, y: 260 + Math.sin(angle) * radius },
      data: { label: twin.id, twin },
      className: `${pageStyles.flowNode} ${pageStyles.patientNode}`,
    };
  });
}

export function TwinGraphPanel({
  experimentId,
  processedBlobId,
  refreshKey,
  onError,
  onToast,
}: {
  experimentId: string;
  processedBlobId: string;
  refreshKey: number;
  onError: (message: string) => void;
  onToast: (title: string, description: string) => void;
}) {
  const [nodesData, setNodesData] = useState<GraphTwinNode[]>([]);
  const [edgesData, setEdgesData] = useState<GraphRelationshipEdge[]>([]);
  const [source, setSource] = useState<"live" | "cache">("cache");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedTwin, setSelectedTwin] = useState<GraphTwinNode | null>(null);
  const [selectedLiveTwin, setSelectedLiveTwin] = useState<AzureDigitalTwin | null>(null);
  const [incoming, setIncoming] = useState<AzureRelationship[]>([]);
  const [outgoing, setOutgoing] = useState<AzureRelationship[]>([]);
  const [propName, setPropName] = useState("");
  const [propValue, setPropValue] = useState("");
  const [edgeScore, setEdgeScore] = useState("");
  const [selectedEdge, setSelectedEdge] = useState<GraphRelationshipEdge | null>(null);

  const onErrorRef = useLatestRef(onError);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [liveTwins, cacheTwins] = await Promise.all([
        getPatientTwinsLive(experimentId),
        getPatientTwinsCache(experimentId),
      ]);
      const liveNodes = graphNodesFromLive(liveTwins);
      if (liveNodes.length > 0) {
        setNodesData(liveNodes);
        setSource("live");
      } else {
        setNodesData(graphNodesFromRows(cacheTwins?.rows, cacheTwins?.patientIdColumn));
        setSource("cache");
      }

      if (processedBlobId) {
        const [liveRels, cacheRels] = await Promise.all([
          getPatientRelationshipsLive(experimentId, processedBlobId),
          getPatientRelationshipsCache(experimentId, processedBlobId),
        ]);
        const liveEdges = graphEdgesFromLive(liveRels);
        setEdgesData(liveEdges.length > 0 ? liveEdges : graphEdgesFromCache(cacheRels));
      } else {
        setEdgesData([]);
      }
    } catch (err) {
      onErrorRef.current(err instanceof ApiError ? err.message : "Could not load twin graph.");
    } finally {
      setLoading(false);
    }
  }, [experimentId, processedBlobId]);

  useExperimentStepLoad(`${experimentId}:${processedBlobId}:${refreshKey}`, load);

  const nodes: Node[] = useMemo(() => layoutNodes(nodesData), [nodesData]);
  const edges: Edge[] = useMemo(
    () =>
      edgesData.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: (edge.cosineSimilarity ?? 0) >= 0.9,
        label:
          edge.cosineSimilarity != null ? edge.cosineSimilarity.toFixed(2) : edge.name,
      })),
    [edgesData],
  );

  const inspectTwin = async (patientId: string) => {
    const fallback = nodesData.find((node) => node.id === patientId) ?? { id: patientId, properties: {} };
    setSelectedTwin(fallback);
    setSelectedEdge(null);
    try {
      const twin = await getPatientTwin(experimentId, patientId);
      setSelectedLiveTwin(twin);
      if (twin) {
        setSelectedTwin({ id: twinIdFrom(twin) ?? patientId, properties: twinPropertiesFrom(twin) });
      }
      const [inRels, outRels] = await Promise.all([
        getTwinRelationshipsIncoming(experimentId, patientId),
        getTwinRelationshipsOutgoing(experimentId, patientId),
      ]);
      setIncoming(relationshipsFromTwinResponse(inRels));
      setOutgoing(relationshipsFromTwinResponse(outRels));
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not load twin details.");
    }
  };

  const handleUpdateTwin = async () => {
    if (!selectedTwin || !propName.trim()) {
      onError("Enter a property name and numeric value.");
      return;
    }
    setBusy(true);
    try {
      const twin = await updatePatientTwin(experimentId, selectedTwin.id, {
        properties: { [propName.trim()]: propValue },
      });
      setSelectedLiveTwin(twin);
      setSelectedTwin({ id: twinIdFrom(twin) ?? selectedTwin.id, properties: twinPropertiesFrom(twin) });
      onToast("Twin updated", selectedTwin.id);
      await load();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not update twin.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTwin = async () => {
    if (!selectedTwin) return;
    setBusy(true);
    try {
      await deletePatientTwin(experimentId, selectedTwin.id);
      setSelectedTwin(null);
      setSelectedLiveTwin(null);
      onToast("Twin deleted", selectedTwin.id);
      await load();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not delete twin.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateEdge = async () => {
    if (!selectedEdge) return;
    const score = Number(edgeScore);
    if (!Number.isFinite(score)) {
      onError("Cosine similarity must be a number.");
      return;
    }
    setBusy(true);
    try {
      await updatePatientRelationship(experimentId, selectedEdge.source, selectedEdge.id, {
        cosineSimilarityScore: score,
      });
      onToast("Relationship updated", selectedEdge.id);
      await load();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not update relationship.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteEdge = async () => {
    if (!selectedEdge) return;
    setBusy(true);
    try {
      await deletePatientRelationship(experimentId, selectedEdge.source, selectedEdge.id);
      setSelectedEdge(null);
      onToast("Relationship deleted", selectedEdge.id);
      await load();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not delete relationship.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAll = async () => {
    setBusy(true);
    try {
      const result = await deleteAllPatientTwins(experimentId);
      onToast("Delete all completed", result.message ?? "Patient twins deletion finished.");
      setSelectedTwin(null);
      await load();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not delete all twins.");
    } finally {
      setBusy(false);
    }
  };

  const handleExportTwins = async () => {
    setBusy(true);
    try {
      const result = await exportPatientTwinsLive(experimentId);
      onToast(
        result.alreadyExists ? "Export already exists" : "Twins exported",
        result.blobId ? `Blob ${result.blobId}` : (result.message ?? "Done"),
      );
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not export live twins.");
    } finally {
      setBusy(false);
    }
  };

  const handleExportRels = async () => {
    setBusy(true);
    try {
      const result = await exportPatientRelationshipsLive(experimentId);
      onToast(
        result.alreadyExists ? "Export already exists" : "Relationships exported",
        result.blobId ? `Blob ${result.blobId}` : (result.message ?? "Done"),
      );
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not export live relationships.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={moi.stepContent}>
      <div className={dt.toolbar}>
        <button type="button" className={dt.ghostBtn} onClick={() => void load()} disabled={loading || busy}>
          Refresh graph
        </button>
        <button type="button" className={dt.ghostBtn} onClick={() => void handleExportTwins()} disabled={busy}>
          Export live twins
        </button>
        <button type="button" className={dt.ghostBtn} onClick={() => void handleExportRels()} disabled={busy}>
          Export live relationships
        </button>
        <button type="button" className={dt.dangerBtn} onClick={() => void handleDeleteAll()} disabled={busy}>
          Delete all twins
        </button>
      </div>
      <p className={moi.dropzoneHint}>
        {loading ? "Loading graph…" : `${nodesData.length} twins · ${edgesData.length} edges · source ${source}`}
      </p>
      {nodesData.length === 0 && !loading ? (
        <p className={moi.dropzoneHint}>No twins to plot yet. Generate twins (and optionally relationships) first.</p>
      ) : null}
      <div className={pageStyles.twinLayout}>
        <div className={pageStyles.flowCanvas}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={{ padding: 0.16 }}
            nodesDraggable={false}
            nodesConnectable={false}
            panOnScroll
            onNodeClick={(_, node) => void inspectTwin(node.id)}
            onEdgeClick={(_, edge) => {
              const match = edgesData.find((item) => item.id === edge.id);
              setSelectedEdge(match ?? { id: edge.id, source: edge.source, target: edge.target });
              setSelectedTwin(null);
              setEdgeScore(match?.cosineSimilarity != null ? String(match.cosineSimilarity) : "");
            }}
          >
            <Background color="#4b637b" gap={20} />
            <MiniMap pannable zoomable nodeStrokeWidth={3} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className={pageStyles.twinAside}>
          <Panel title={selectedEdge ? "Selected relationship" : "Selected twin"}>
            {selectedEdge ? (
              <div className={moi.stepContent}>
                <div className={pageStyles.detailList}>
                  <div>
                    <dt>ID</dt>
                    <dd>{selectedEdge.id}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>{selectedEdge.source}</dd>
                  </div>
                  <div>
                    <dt>Target</dt>
                    <dd>{selectedEdge.target}</dd>
                  </div>
                  <div>
                    <dt>Cosine</dt>
                    <dd>{selectedEdge.cosineSimilarity ?? "—"}</dd>
                  </div>
                </div>
                <div className={dt.propertyEditor}>
                  <label>
                    Cosine similarity
                    <input value={edgeScore} onChange={(event) => setEdgeScore(event.target.value)} />
                  </label>
                  <span />
                  <button type="button" className={moi.primaryBtn} onClick={() => void handleUpdateEdge()} disabled={busy}>
                    Save
                  </button>
                </div>
                <button type="button" className={dt.dangerBtn} onClick={() => void handleDeleteEdge()} disabled={busy}>
                  Delete relationship
                </button>
              </div>
            ) : selectedTwin ? (
              <div className={moi.stepContent}>
                <div className={pageStyles.detailList}>
                  <div>
                    <dt>Patient</dt>
                    <dd>{selectedTwin.id}</dd>
                  </div>
                  {Object.entries(selectedTwin.properties)
                    .slice(0, 12)
                    .map(([key, value]) => (
                      <div key={key}>
                        <dt>{key}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                </div>
                {selectedLiveTwin ? (
                  <p className={moi.dropzoneHint}>Live Azure twin loaded.</p>
                ) : (
                  <p className={moi.dropzoneHint}>Showing cached row. Live GET was empty.</p>
                )}
                <div className={dt.propertyEditor}>
                  <label>
                    Property
                    <input value={propName} onChange={(event) => setPropName(event.target.value)} />
                  </label>
                  <label>
                    Value
                    <input value={propValue} onChange={(event) => setPropValue(event.target.value)} />
                  </label>
                  <button type="button" className={moi.primaryBtn} onClick={() => void handleUpdateTwin()} disabled={busy}>
                    Save
                  </button>
                </div>
                <button type="button" className={dt.dangerBtn} onClick={() => void handleDeleteTwin()} disabled={busy}>
                  Delete twin
                </button>
                <div>
                  <p className={ui.metricLabel}>Incoming</p>
                  <ul className={dt.relList}>
                    {incoming.length === 0 ? <li>None</li> : null}
                    {incoming.map((rel) => (
                      <li key={relationshipIdFrom(rel) ?? JSON.stringify(rel)}>
                        <span>{relationshipSourceFrom(rel)}</span>
                        <span>{relationshipCosineFrom(rel)?.toFixed(2) ?? ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={ui.metricLabel}>Outgoing</p>
                  <ul className={dt.relList}>
                    {outgoing.length === 0 ? <li>None</li> : null}
                    {outgoing.map((rel) => (
                      <li key={relationshipIdFrom(rel) ?? JSON.stringify(rel)}>
                        <span>{relationshipTargetFrom(rel)}</span>
                        <span>{relationshipCosineFrom(rel)?.toFixed(2) ?? ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className={ui.muted}>Select a node or edge on the graph.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
