"use client";

import { useEffect, useState } from "react";
import type { ModalModel } from "../../models/modal";
import styles from "./Modal.module.css";

export function ModalComponent({ modal, onClose }: { modal: ModalModel; onClose: () => void }) {
  const [inputValue, setInputValue] = useState(modal.kind === "input" ? modal.defaultValue ?? "" : "");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handlePrimary = () => {
    if (modal.kind === "information") {
      modal.onOk?.();
      onClose();
      return;
    }
    if (modal.kind === "confirm") {
      modal.onYes?.();
      onClose();
      return;
    }
    modal.onOk?.(inputValue);
    onClose();
  };

  const handleSecondary = () => {
    if (modal.kind === "confirm") {
      modal.onNo?.();
    } else if (modal.kind === "input") {
      modal.onCancel?.();
    }
    onClose();
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 id="modal-title">{modal.title}</h2>
          <button className={styles.close} type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.content}>
          <p className={styles.description}>{modal.description}</p>
          {modal.kind === "input" ? (
            <label>
              {modal.label}
              <input value={inputValue} onChange={(event) => setInputValue(event.target.value)} autoFocus />
            </label>
          ) : null}
        </div>
        <div className={styles.actions}>
          {modal.kind === "confirm" ? (
            <>
              <button className={styles.button} type="button" onClick={handleSecondary}>
                No
              </button>
              <button className={styles.primary} type="button" onClick={handlePrimary}>
                Yes
              </button>
            </>
          ) : modal.kind === "input" ? (
            <>
              <button className={styles.button} type="button" onClick={handleSecondary}>
                Cancel
              </button>
              <button className={styles.primary} type="button" onClick={handlePrimary}>
                Ok
              </button>
            </>
          ) : (
            <button className={styles.primary} type="button" onClick={handlePrimary}>
              Ok
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
