import type {
  AzureDigitalTwin,
  AzureRelationship,
  DtFeatureExtractionItem,
  DtGenerateRelationshipsItem,
  GraphRelationshipEdge,
  GraphTwinNode,
  LiveRelationshipsResponse,
  LiveTwinsResponse,
  PatientRelationshipItem,
} from "./digitalTwinsTypes";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : null;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function featureTypeEntries(item: DtFeatureExtractionItem | null | undefined): Array<[string, string]> {
  const raw = item?.featureTypes;
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw).map(([name, types]) => {
    let label = "";
    if (Array.isArray(types)) label = types.map(String).join(", ");
    else if (types instanceof Set) label = [...types].map(String).join(", ");
    else if (typeof types === "string") label = types;
    else if (types && typeof types === "object") label = Object.keys(types as object).join(", ");
    return [name, label || "unknown"];
  });
}

export function twinIdFrom(twin: AzureDigitalTwin | null | undefined): string | undefined {
  const rec = asRecord(twin);
  if (!rec) return undefined;
  return asString(rec.$dtId) ?? asString(rec.id) ?? asString(rec.patientId);
}

export function twinPropertiesFrom(twin: AzureDigitalTwin | null | undefined): Record<string, string> {
  const rec = asRecord(twin);
  if (!rec) return {};
  const contents = asRecord(rec.contents) ?? rec;
  const props: Record<string, string> = {};
  for (const [key, value] of Object.entries(contents)) {
    if (key.startsWith("$") || key === "id" || key === "metadata" || key === "contents") continue;
    if (value == null || typeof value === "object") continue;
    props[key] = String(value);
  }
  return props;
}

export function relationshipIdFrom(rel: AzureRelationship | null | undefined): string | undefined {
  const rec = asRecord(rel);
  if (!rec) return undefined;
  return asString(rec.$relationshipId) ?? asString(rec.id);
}

export function relationshipSourceFrom(rel: AzureRelationship | null | undefined): string | undefined {
  const rec = asRecord(rel);
  if (!rec) return undefined;
  return asString(rec.$sourceId) ?? asString(rec.sourceId) ?? asString(rec.sourceTwinId);
}

export function relationshipTargetFrom(rel: AzureRelationship | null | undefined): string | undefined {
  const rec = asRecord(rel);
  if (!rec) return undefined;
  return asString(rec.$targetId) ?? asString(rec.targetId) ?? asString(rec.targetTwinId);
}

export function relationshipNameFrom(rel: AzureRelationship | null | undefined): string | undefined {
  const rec = asRecord(rel);
  if (!rec) return undefined;
  return asString(rec.$relationshipName) ?? asString(rec.name) ?? asString(rec.relationshipName);
}

export function relationshipCosineFrom(rel: AzureRelationship | null | undefined): number | undefined {
  const rec = asRecord(rel);
  if (!rec) return undefined;
  const props = asRecord(rec.properties);
  return (
    asNumber(rec.cosineSimilarity) ??
    asNumber(rec.cosineSimilarityScore) ??
    asNumber(props?.cosineSimilarity) ??
    asNumber(props?.cosineSimilarityScore)
  );
}

export function graphNodesFromLive(response: LiveTwinsResponse | null | undefined): GraphTwinNode[] {
  const twins = response?.twins ?? [];
  return twins
    .map((twin) => {
      const id = twinIdFrom(twin);
      if (!id) return null;
      return { id, properties: twinPropertiesFrom(twin) };
    })
    .filter((node): node is GraphTwinNode => node != null);
}

export function graphNodesFromRows(
  rows: Array<Record<string, string | null | undefined>> | undefined,
  patientIdColumn = "patient_id",
): GraphTwinNode[] {
  if (!rows?.length) return [];
  return rows
    .map((row) => {
      const id =
        asString(row[patientIdColumn]) ??
        asString(row.patient_id) ??
        asString(row.patientId);
      if (!id) return null;
      const properties: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        if (key.toLowerCase() === patientIdColumn.toLowerCase()) continue;
        if (value == null || value === "") continue;
        properties[key] = String(value);
      }
      return { id, properties };
    })
    .filter((node): node is GraphTwinNode => node != null);
}

export function graphEdgesFromLive(response: LiveRelationshipsResponse | null | undefined): GraphRelationshipEdge[] {
  const rels = response?.relationships ?? [];
  const edges: GraphRelationshipEdge[] = [];
  for (const rel of rels) {
    const source = relationshipSourceFrom(rel);
    const target = relationshipTargetFrom(rel);
    if (!source || !target) continue;
    edges.push({
      id: relationshipIdFrom(rel) ?? `${source}->${target}`,
      source,
      target,
      name: relationshipNameFrom(rel),
      cosineSimilarity: relationshipCosineFrom(rel),
    });
  }
  return edges;
}

export function graphEdgesFromCache(item: DtGenerateRelationshipsItem | null | undefined): GraphRelationshipEdge[] {
  const pairs = item?.patientRelationships ?? [];
  const edges: GraphRelationshipEdge[] = [];
  pairs.forEach((pair: PatientRelationshipItem, index) => {
    if (!pair.sourcePatientId || !pair.targetPatientId) return;
    edges.push({
      id: `${pair.sourcePatientId}->${pair.targetPatientId}-${index}`,
      source: pair.sourcePatientId,
      target: pair.targetPatientId,
      cosineSimilarity: pair.cosineSimilarityScore,
    });
  });
  return edges;
}

export function relationshipsFromTwinResponse(value: unknown): AzureRelationship[] {
  const rec = asRecord(value);
  if (!rec) return [];
  const list = rec.relationships ?? rec.Relationships;
  return Array.isArray(list) ? (list as AzureRelationship[]) : [];
}
