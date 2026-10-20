"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useStore,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
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

const DEFAULT_COSINE = 0.8;
const DEFAULT_MAX_NODES = 80;
const DEFAULT_MAX_EDGES = 8;
const DEFAULT_K_HOP = 1;
const SEARCH_LIMIT = 12;
const LABEL_ZOOM = 0.62;

function cosineOf(edge: GraphRelationshipEdge): number {
  return edge.cosineSimilarity ?? Number.NEGATIVE_INFINITY;
}

function filterEdges(
  edges: GraphRelationshipEdge[],
  minCosine: number,
  nameQuery: string,
): GraphRelationshipEdge[] {
  const q = nameQuery.trim().toLowerCase();
  return edges.filter((edge) => {
    if (edge.cosineSimilarity == null || edge.cosineSimilarity < minCosine) return false;
    if (q && !(edge.name ?? "").toLowerCase().includes(q)) return false;
    return true;
  });
}

function capEdgesPerNode(edges: GraphRelationshipEdge[], maxPerNode: number): GraphRelationshipEdge[] {
  if (!Number.isFinite(maxPerNode) || maxPerNode <= 0) return edges;
  const byNode = new Map<string, GraphRelationshipEdge[]>();
  const add = (id: string, edge: GraphRelationshipEdge) => {
    const list = byNode.get(id);
    if (list) list.push(edge);
    else byNode.set(id, [edge]);
  };
  for (const edge of edges) {
    add(edge.source, edge);
    if (edge.target !== edge.source) add(edge.target, edge);
  }
  const keep = new Set<string>();
  for (const list of byNode.values()) {
    const ranked = [...list].sort((a, b) => cosineOf(b) - cosineOf(a));
    for (const edge of ranked.slice(0, maxPerNode)) keep.add(edge.id);
  }
  return edges.filter((edge) => keep.has(edge.id));
}

function adjacencyFrom(edges: GraphRelationshipEdge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const link = (from: string, to: string) => {
    const list = map.get(from);
    if (list) list.push(to);
    else map.set(from, [to]);
  };
  for (const edge of edges) {
    link(edge.source, edge.target);
    link(edge.target, edge.source);
  }
  return map;
}

function egoNodeIds(centerId: string, hops: number, edges: GraphRelationshipEdge[]): Set<string> {
  const seen = new Set<string>([centerId]);
  if (hops <= 0) return seen;
  const adj = adjacencyFrom(edges);
  let frontier = [centerId];
  for (let hop = 0; hop < hops; hop += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbor of adj.get(id) ?? []) {
        if (seen.has(neighbor)) continue;
        seen.add(neighbor);
        next.push(neighbor);
      }
    }
    frontier = next;
  }
  return seen;
}

function nodeScore(id: string, edges: GraphRelationshipEdge[]): { degree: number; bestCosine: number } {
  let degree = 0;
  let bestCosine = Number.NEGATIVE_INFINITY;
  for (const edge of edges) {
    if (edge.source !== id && edge.target !== id) continue;
    degree += 1;
    bestCosine = Math.max(bestCosine, cosineOf(edge));
  }
  return { degree, bestCosine };
}

function capVisibleTwins(
  twins: GraphTwinNode[],
  edges: GraphRelationshipEdge[],
  maxNodes: number,
  preferId: string | null,
): { twins: GraphTwinNode[]; edges: GraphRelationshipEdge[] } {
  if (twins.length <= maxNodes) return { twins, edges };
  const ranked = twins
    .map((twin) => {
      const stats = nodeScore(twin.id, edges);
      const boost = preferId && twin.id === preferId ? 1e9 : 0;
      const sim = Number.isFinite(stats.bestCosine) ? stats.bestCosine : 0;
      return { twin, rank: boost + stats.degree * 10 + sim };
    })
    .sort((a, b) => b.rank - a.rank || a.twin.id.localeCompare(b.twin.id));
  const keep = new Set(ranked.slice(0, maxNodes).map((item) => item.twin.id));
  if (preferId) keep.add(preferId);
  const nextTwins = twins.filter((twin) => keep.has(twin.id));
  const nextEdges = edges.filter((edge) => keep.has(edge.source) && keep.has(edge.target));
  return { twins: nextTwins, edges: nextEdges };
}

function layoutNodes(twins: GraphTwinNode[], focusId: string | null): Node[] {
  const count = twins.length;
  if (count === 0) return [];
  const useGrid = count > 36;
  if (useGrid) {
    const cols = Math.ceil(Math.sqrt(count));
    const gap = 88 + Math.max(12, 640 / Math.max(cols, 1));
    return twins.map((twin, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        id: twin.id,
        type: "patientTwin",
        position: { x: 32 + col * gap, y: 32 + row * gap },
        data: { label: twin.id, twin, focused: twin.id === focusId },
      };
    });
  }
  const radius = 90 + count * 16;
  const cx = radius + 72;
  const cy = radius + 72;
  return twins.map((twin, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      id: twin.id,
      type: "patientTwin",
      position: { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius },
      data: { label: twin.id, twin, focused: twin.id === focusId },
    };
  });
}

function PatientTwinNode({ data }: NodeProps) {
  const zoom = useStore((state) => state.transform[2]);
  const label = String((data as { label?: string }).label ?? "");
  const focused = Boolean((data as { focused?: boolean }).focused);
  const showLabel = zoom >= LABEL_ZOOM;
  return (
    <div
      className={`${pageStyles.flowNode} ${pageStyles.patientNode} ${showLabel ? "" : pageStyles.flowNodeCompact} ${focused ? pageStyles.patientNodeFocus : ""}`}
      title={label}
    >
      <Handle type="target" position={Position.Left} className={pageStyles.flowHandle} />
      <Handle type="source" position={Position.Right} className={pageStyles.flowHandle} />
      {showLabel ? <span className={pageStyles.flowNodeLabel}>{label}</span> : <span className={pageStyles.flowNodeTick} />}
    </div>
  );
}

const PATIENT_NODE_TYPES = { patientTwin: PatientTwinNode };

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusPatientId, setFocusPatientId] = useState<string | null>(null);
  const [minCosine, setMinCosine] = useState(DEFAULT_COSINE);
  const [maxEdgesPerNode, setMaxEdgesPerNode] = useState(DEFAULT_MAX_EDGES);
  const [relName, setRelName] = useState("");
  const [maxNodesShown, setMaxNodesShown] = useState(DEFAULT_MAX_NODES);
  const [kHop, setKHop] = useState(DEFAULT_K_HOP);
  const [fitNonce, setFitNonce] = useState(0);
  const flowRef = useRef<ReactFlowInstance | null>(null);

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

  const searchHits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return nodesData.filter((node) => node.id.toLowerCase().includes(q)).slice(0, SEARCH_LIMIT);
  }, [nodesData, searchQuery]);

  const visibleGraph = useMemo(() => {
    const maxNodes = Math.max(1, Math.floor(maxNodesShown) || DEFAULT_MAX_NODES);
    const hops = Math.max(0, Math.floor(kHop) || 0);
    let nextEdges = capEdgesPerNode(filterEdges(edgesData, minCosine, relName), maxEdgesPerNode);
    let nextTwins = nodesData;
    if (focusPatientId) {
      const allowed = egoNodeIds(focusPatientId, hops, nextEdges);
      nextTwins = nodesData.filter((node) => allowed.has(node.id));
      if (!nextTwins.some((node) => node.id === focusPatientId)) {
        const focusNode = nodesData.find((node) => node.id === focusPatientId);
        if (focusNode) nextTwins = [focusNode, ...nextTwins];
      }
      nextEdges = nextEdges.filter((edge) => allowed.has(edge.source) && allowed.has(edge.target));
    }
    return capVisibleTwins(nextTwins, nextEdges, maxNodes, focusPatientId);
  }, [edgesData, focusPatientId, kHop, maxEdgesPerNode, maxNodesShown, minCosine, nodesData, relName]);

  const pickerRows = useMemo(
    () =>
      visibleGraph.twins
        .map((twin) => {
          const stats = nodeScore(twin.id, visibleGraph.edges);
          return { twin, degree: stats.degree, bestCosine: stats.bestCosine };
        })
        .sort((a, b) => b.degree - a.degree || b.bestCosine - a.bestCosine || a.twin.id.localeCompare(b.twin.id)),
    [visibleGraph],
  );

  const nodes: Node[] = useMemo(
    () => layoutNodes(visibleGraph.twins, focusPatientId),
    [focusPatientId, visibleGraph.twins],
  );
  const edges: Edge[] = useMemo(
    () =>
      visibleGraph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: (edge.cosineSimilarity ?? 0) >= 0.9,
        label: edge.cosineSimilarity != null ? edge.cosineSimilarity.toFixed(2) : edge.name,
      })),
    [visibleGraph.edges],
  );
  const nodesRef = useLatestRef(nodes);

  useEffect(() => {
    if (!fitNonce) return;
    const rf = flowRef.current;
    if (!rf) return;
    const timer = window.setTimeout(() => {
      void rf.fitView({
        nodes: nodesRef.current,
        padding: 0.28,
        duration: 280,
        minZoom: 0.05,
      });
    }, 40);
    return () => window.clearTimeout(timer);
  }, [fitNonce, nodesRef]);

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

  const selectPatient = (patientId: string) => {
    setFocusPatientId(patientId);
    setSearchQuery(patientId);
    setSearchOpen(false);
    setFitNonce((value) => value + 1);
    void inspectTwin(patientId);
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
      if (focusPatientId === selectedTwin.id) setFocusPatientId(null);
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
      setFocusPatientId(null);
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
      <div className={dt.graphFilters}>
        <div className={dt.searchWrap}>
          <label>
            Find patient
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && searchHits[0]) {
                  event.preventDefault();
                  selectPatient(searchHits[0].id);
                }
              }}
              placeholder="Type a patient ID"
            />
          </label>
          {searchOpen && searchHits.length > 0 ? (
            <ul className={dt.searchHits}>
              {searchHits.map((hit) => (
                <li key={hit.id}>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectPatient(hit.id)}>
                    {hit.id}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <label>
          Cosine ≥ {minCosine.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={minCosine}
            onChange={(event) => setMinCosine(Number(event.target.value))}
          />
        </label>
        <label>
          Max edges / node
          <input
            type="number"
            min={0}
            value={maxEdgesPerNode}
            onChange={(event) => setMaxEdgesPerNode(Number(event.target.value))}
          />
        </label>
        <label>
          Relationship name
          <input value={relName} onChange={(event) => setRelName(event.target.value)} placeholder="Contains…" />
        </label>
        <label>
          Max nodes
          <input
            type="number"
            min={1}
            value={maxNodesShown}
            onChange={(event) => setMaxNodesShown(Number(event.target.value))}
          />
        </label>
        <label>
          Ego k-hop
          <input type="number" min={0} max={6} value={kHop} onChange={(event) => setKHop(Number(event.target.value))} />
        </label>
        <button
          type="button"
          className={dt.ghostBtn}
          onClick={() => {
            setFocusPatientId(null);
            setSearchQuery("");
            setFitNonce((value) => value + 1);
          }}
          disabled={!focusPatientId}
        >
          Clear focus
        </button>
      </div>
      <p className={moi.dropzoneHint}>
        {loading
          ? "Loading graph…"
          : `Plotting ${visibleGraph.twins.length} of ${nodesData.length} twins · ${visibleGraph.edges.length} of ${edgesData.length} edges · source ${source}${focusPatientId ? ` · ego ${focusPatientId} (k=${Math.max(0, Math.floor(kHop) || 0)})` : ""}`}
      </p>
      {nodesData.length === 0 && !loading ? (
        <p className={moi.dropzoneHint}>No twins to plot yet. Generate twins (and optionally relationships) first.</p>
      ) : null}
      <div className={pageStyles.twinLayout}>
        <aside className={pageStyles.twinPicker}>
          <Panel title="Visible twins" meta={String(pickerRows.length)}>
            <p className={ui.muted}>Select a row to inspect and fit that neighborhood.</p>
            <div className={dt.pickerTableWrap}>
              {pickerRows.length === 0 ? (
                <p className={moi.dropzoneHint}>No twins in the current filter.</p>
              ) : (
                <table className={dt.pickerTable}>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Deg</th>
                      <th>Cos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickerRows.map((row) => (
                      <tr key={row.twin.id}>
                        <td>
                          <button
                            type="button"
                            className={`${dt.pickerRowBtn} ${focusPatientId === row.twin.id ? dt.pickerRowBtnActive : ""}`}
                            onClick={() => selectPatient(row.twin.id)}
                          >
                            {row.twin.id}
                          </button>
                        </td>
                        <td>{row.degree}</td>
                        <td>{Number.isFinite(row.bestCosine) ? row.bestCosine.toFixed(2) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Panel>
        </aside>
        <div className={pageStyles.flowCanvas}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={PATIENT_NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.16, minZoom: 0.05 }}
            minZoom={0.05}
            onlyRenderVisibleElements
            nodesDraggable={false}
            nodesConnectable={false}
            panOnScroll
            onInit={(instance) => {
              flowRef.current = instance;
            }}
            onNodeClick={(_, node) => selectPatient(node.id)}
            onEdgeClick={(_, edge) => {
              const match = visibleGraph.edges.find((item) => item.id === edge.id) ?? edgesData.find((item) => item.id === edge.id);
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
              <p className={ui.muted}>Select a patient from the table, search, or graph.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
