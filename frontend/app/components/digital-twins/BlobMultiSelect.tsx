import type { Blob } from "../../lib/multiOmicsTypes";
import moi from "../multi-omics/MultiOmics.module.css";
import styles from "./DigitalTwins.module.css";

export function BlobMultiSelect({
  blobs,
  value,
  onChange,
  label = "Final selected matrix blobs",
  emptyLabel = "No experiment blobs available. Finish multi-omics first.",
}: {
  blobs: Blob[];
  value: string[];
  onChange: (blobIds: string[]) => void;
  label?: string;
  emptyLabel?: string;
}) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  };

  if (blobs.length === 0) {
    return (
      <label>
        {label}
        <p className={moi.dropzoneHint}>{emptyLabel}</p>
      </label>
    );
  }

  return (
    <fieldset className={styles.blobFieldset}>
      <legend>{label}</legend>
      <div className={styles.blobCheckList}>
        {blobs.map((blob) => {
          const id = blob.id;
          return (
            <label key={id} className={styles.blobCheck}>
              <input type="checkbox" checked={value.includes(id)} onChange={() => toggle(id)} />
              <span>
                {blob.fileName ?? id}
                {blob.extension ? `.${blob.extension.replace(/^\./, "")}` : ""}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
