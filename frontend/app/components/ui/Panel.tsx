import styles from "./Ui.module.css";

export function Panel({
  title,
  meta,
  children,
  className = "",
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${styles.panel} ${className}`}>
      <div className={styles.panelHead}>
        <h3>{title}</h3>
        {meta ? <span>{meta}</span> : null}
      </div>
      {children}
    </div>
  );
}
