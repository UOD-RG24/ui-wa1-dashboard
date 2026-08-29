"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ApiError } from "../../lib/apiClient";
import { uploadExperimentBlob } from "../../lib/multiOmicsApi";
import styles from "./MultiOmics.module.css";

export function BlobUploadDropzone({
  experimentId,
  onUploaded,
  onError,
}: {
  experimentId: string;
  onUploaded: () => void;
  onError: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<File | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setPreview(file);
      setUploading(true);
      try {
        await uploadExperimentBlob(experimentId, file);
        onUploaded();
        setPreview(null);
      } catch (err) {
        onError(err instanceof ApiError ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [experimentId, onError, onUploaded],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: (files) => void onDrop(files),
    accept: { "text/csv": [".csv"], "text/tab-separated-values": [".tsv"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ""} ${uploading ? styles.dropzoneDisabled : ""}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <p className={styles.dropzoneHint}>
          <span className={styles.spinner} />
          Uploading…
        </p>
      ) : (
        <>
          <p className={styles.dropzoneHint}>
            Drag & drop a .csv or .tsv file here, or click to browse
          </p>
          {isDragReject ? (
            <p className={styles.dropzoneHint}>Only .csv and .tsv files are accepted.</p>
          ) : null}
          {preview ? (
            <p className={styles.dropzoneFile}>
              {preview.name} ({Math.round(preview.size / 1024)} KB)
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
