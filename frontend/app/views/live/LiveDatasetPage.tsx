import { Panel } from "../../components/ui/Panel";
import { Section } from "../../components/ui/Section";
import type { DatasetItem } from "../../types";
import styles from "./PipelinePage.module.css";

export function LiveDatasetPage({ dataset }: { dataset: DatasetItem }) {
  return (
    <>
      <Section title="Live dataset record">
        <Panel title={dataset.name} meta={`${dataset.omicsType ?? dataset.type} · ${dataset.status ?? "unknown"}`}>
          <div className={styles.metaRow}>
            <span><b>Rows</b>{dataset.rowCount?.toLocaleString() ?? "Not available"}</span>
            <span><b>Columns</b>{dataset.columnCount?.toLocaleString() ?? "Not available"}</span>
            <span><b>Missing values</b>{dataset.missingValuePercentage === null || dataset.missingValuePercentage === undefined ? "Not available" : `${dataset.missingValuePercentage.toFixed(2)}%`}</span>
            <span><b>File</b>{dataset.originalFileName}</span>
            <span><b>Format</b>{dataset.fileType?.toUpperCase()}</span>
            <span><b>SHA-256</b><code>{dataset.sha256?.slice(0, 16)}…</code></span>
          </div>
        </Panel>
      </Section>
      <Section title="Use in pipeline">
        <Panel title="Validated input selection">
          <p>
            Select this dataset in the matching mRNA, CNA, or clinical slot of an experiment. Files remain immutable; changing an input creates a new run ID.
          </p>
        </Panel>
      </Section>
    </>
  );
}
