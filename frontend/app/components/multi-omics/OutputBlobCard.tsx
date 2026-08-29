"use client";

import { FiCopy } from "react-icons/fi";
import styles from "./MultiOmics.module.css";

export function OutputBlobCard({ label, blobId }: { label: string; blobId?: string }) {
  if (!blobId) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(blobId);
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.blobCard}>
      <span>
        <strong>{label}:</strong> {blobId}
      </span>
      <button type="button" className={styles.iconBtn} onClick={() => void copy()} aria-label="Copy blob ID">
        <FiCopy />
      </button>
    </div>
  );
}
