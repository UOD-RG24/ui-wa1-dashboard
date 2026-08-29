import type { Blob } from "../../lib/multiOmicsTypes";
import styles from "./MultiOmics.module.css";

export function BlobSelect({
  blobs,
  value,
  onChange,
  label = "Blob",
  emptyLabel = "No blobs available",
}: {
  blobs: Blob[];
  value: string;
  onChange: (blobId: string) => void;
  label?: string;
  emptyLabel?: string;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={blobs.length === 0}>
        <option value="">{blobs.length === 0 ? emptyLabel : "Select blob…"}</option>
        {blobs.map((b) => (
          <option key={b.id} value={b.id}>
            {b.fileName ?? b.id}
          </option>
        ))}
      </select>
    </label>
  );
}
