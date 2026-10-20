import type {
  CreateDefinedFeatureMatrixItem,
  DefinedFeatureMatrixProcessInfo,
  FeatureExtractionItem,
  FeatureExtractionProcessInfo,
} from "./multiOmicsTypes";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as AnyRecord) : null;
}

/** Core API JSON uses `featureExtraction`; OpenAPI/BSON alias is `designMatrixFeatureExtraction`. */
function featureExtractionRoot(item: FeatureExtractionItem): AnyRecord | null {
  return (
    asRecord(item.designMatrixFeatureExtraction) ??
    asRecord((item as AnyRecord).featureExtraction)
  );
}

export function normalizeFeatureExtraction(
  item: FeatureExtractionItem,
): FeatureExtractionProcessInfo | null {
  const root = featureExtractionRoot(item);
  if (!root) return null;

  if (Array.isArray(root.featureNames)) {
    return root as FeatureExtractionProcessInfo;
  }

  const response =
    asRecord(root.designMatrixProcessResponse) ?? asRecord(root.design_matrix_process_response);
  const info =
    asRecord(response?.featureExtractionProcessInfo) ??
    asRecord(response?.featureExtractionProcessInfo);

  if (!info) return null;

  return {
    featureCount: info.featureCount as number | undefined,
    excludedColumnCount: info.excludedColumnCount as number | undefined,
    totalColumnCount: info.totalColumnCount as number | undefined,
    featureNames: (info.featureNames as string[]) ?? [],
    steps: (response?.steps as FeatureExtractionProcessInfo["steps"]) ?? [],
  };
}

export function featureNamesFromExtractionItems(items: FeatureExtractionItem[]): string[] {
  for (let i = items.length - 1; i >= 0; i--) {
    const info = normalizeFeatureExtraction(items[i]);
    if (info?.featureNames?.length) return info.featureNames;
  }
  return [];
}

function definedMatrixRoot(item: CreateDefinedFeatureMatrixItem): AnyRecord | null {
  return (
    asRecord(item.designMatrixDefinedFeatureMatrix) ??
    asRecord((item as AnyRecord).definedFeatureMatrix)
  );
}

export function normalizeDefinedFeatureMatrix(
  item: CreateDefinedFeatureMatrixItem,
): DefinedFeatureMatrixProcessInfo | null {
  const root = definedMatrixRoot(item);
  if (!root) return null;

  if (typeof root.selectedFeatureCount === "number" || typeof root.rowCount === "number") {
    return root as DefinedFeatureMatrixProcessInfo;
  }

  const response =
    asRecord(root.designMatrixProcessResponse) ?? asRecord(root.design_matrix_process_response);
  const info =
    asRecord(response?.createDefinedFeatureMatrixProcessInfo) ??
    asRecord(response?.createDefinedFeatureMatrixProcessInfo);

  if (!info) return null;

  return {
    rowCount: info.rowCount as number | undefined,
    columnCount: info.columnCount as number | undefined,
    selectedFeatureCount: info.selectedFeatureCount as number | undefined,
    totalFeatureCount: info.totalFeatureCount as number | undefined,
    steps: (response?.steps as DefinedFeatureMatrixProcessInfo["steps"]) ?? [],
  };
}
