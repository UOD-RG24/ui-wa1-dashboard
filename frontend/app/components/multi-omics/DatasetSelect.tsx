import type { DatasetItem } from "../../types";
import styles from "./MultiOmics.module.css";

export function DatasetSelect({
  datasets,
  value,
  onChange,
}: {
  datasets: DatasetItem[];
  value: string;
  onChange: (datasetId: string) => void;
}) {
  return (
    <div className={styles.datasetRow}>
      <label>
        Dataset
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select dataset…</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
