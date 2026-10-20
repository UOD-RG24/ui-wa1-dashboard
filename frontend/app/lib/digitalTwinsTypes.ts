/** Types derived from openapi.yaml — digital twins */

export interface DtExtractFeaturesRequest {
  datasetId: string;
  finalSelectedMatrixBlobIds: string[];
}

export interface DtGenerateTwinsRequest {
  datasetId: string;
  finalSelectedMatrixBlobIds: string[];
}

export interface DtGenerateRelationshipsRequest {
  datasetId: string;
  finalSelectedMatrixBlobId: string;
  minimumSimilarity?: number;
}

export interface DtUpdateTwinsRequest {
  properties: Record<string, string | null>;
}

export interface DtUpdateRelationshipRequest {
  cosineSimilarityScore: number;
}

export interface DtFeatureExtractionItem {
  blobIdsProcessed?: string[];
  featureTypes?: Record<string, string[] | Set<string> | unknown>;
  timeElapsedSeconds?: number;
}

export interface DtGenerateTwinsItem {
  processedBlobIds?: string[];
  patientIdColumn?: string;
  patientCount?: number;
  featureKeys?: string[];
  rows?: Array<Record<string, string | null | undefined>>;
  generatedAt?: string;
}

export interface PatientRelationshipItem {
  sourcePatientId: string;
  targetPatientId: string;
  cosineSimilarityScore: number;
  featureCount?: number;
}

export interface DtGenerateRelationshipsItem {
  processedBlobId?: string;
  patientIdColumn?: string;
  patientCount?: number;
  featureKeys?: string[];
  patientRelationships?: PatientRelationshipItem[];
  generatedAt?: string;
}

export interface DigitalTwinsRecord {
  id?: string;
  experimentId?: string;
  datasetId?: string;
  userId?: string;
  featureExtraction?: DtFeatureExtractionItem;
  featureExtractionItem?: DtFeatureExtractionItem;
  generateTwins?: DtGenerateTwinsItem;
  generateTwinsItem?: DtGenerateTwinsItem;
  generateRelationships?: DtGenerateRelationshipsItem[];
  generateRelationshipsItems?: DtGenerateRelationshipsItem[];
}

export type AzureDigitalTwin = Record<string, unknown>;

export type AzureRelationship = Record<string, unknown>;

export interface LiveTwinsResponse {
  totalTwins?: number;
  twins?: AzureDigitalTwin[];
}

export interface TwinCreateResult {
  message?: string;
  totalTwins?: number;
  createdOrUpdated?: number;
  patientCount?: number;
  featureKeys?: string[];
  rows?: Array<Record<string, string | null | undefined>>;
  results?: Array<{ twinId?: string; success?: boolean; error?: string }>;
}

export interface RelationshipExtractSummary {
  experimentId?: string;
  datasetId?: string;
  processedBlobId?: string;
  patientCount?: number;
  featureCount?: number;
  minimumSimilarity?: number;
}

export interface LiveRelationshipsResponse {
  processedBlobId?: string;
  sourceTwinCount?: number;
  relationshipCount?: number;
  relationships?: AzureRelationship[];
  failedTwinCount?: number;
  failures?: unknown[];
}

export interface TwinRelationshipsResponse {
  patientId?: string;
  relationshipCount?: number;
  relationships?: AzureRelationship[];
}

export interface MessageResponse {
  message?: string;
  [key: string]: unknown;
}

export interface LiveExportResponse {
  message?: string;
  blobId?: string;
  blob?: { id?: string; fileName?: string };
  patientCount?: number;
  relationshipCount?: number;
  existingBlobId?: string;
  existingBlob?: { id?: string };
  error?: string;
  alreadyExists?: boolean;
}

export interface GraphTwinNode {
  id: string;
  properties: Record<string, string>;
}

export interface GraphRelationshipEdge {
  id: string;
  source: string;
  target: string;
  name?: string;
  cosineSimilarity?: number;
}
