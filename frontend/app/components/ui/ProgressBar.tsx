import styles from "./Ui.module.css";

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className={styles.progress} aria-label={`${value}%`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
