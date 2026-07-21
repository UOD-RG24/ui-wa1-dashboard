"use client";

import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo } from "react-icons/fi";
import type { ToastModel, ToastStatus } from "../../models/toast";
import styles from "./Toast.module.css";

const statusIcons: Record<ToastStatus, React.ReactNode> = {
  info: <FiInfo />,
  success: <FiCheckCircle />,
  warning: <FiAlertTriangle />,
  error: <FiAlertCircle />,
};

export function ToastComponent({ toast, onClose }: { toast: ToastModel; onClose: (id: string) => void }) {
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={`${styles.statusIcon} ${styles[toast.status]}`} aria-hidden="true">
        {statusIcons[toast.status]}
      </span>
      <div className={styles.body}>
        <p className={styles.title}>{toast.title}</p>
        <p className={styles.description}>{toast.description}</p>
      </div>
      <button className={styles.close} type="button" aria-label="Close" onClick={() => onClose(toast.id)}>
        ×
      </button>
    </div>
  );
}

export function ToastStack({ toasts, onClose }: { toasts: ToastModel[]; onClose: (id: string) => void }) {
  if (!toasts.length) return null;

  return (
    <div className={styles.toastStack} aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
