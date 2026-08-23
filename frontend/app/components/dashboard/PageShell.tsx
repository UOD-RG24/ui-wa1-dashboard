import styles from "./PageShell.module.css";

export function PageShell({
  category,
  title,
  actions,
  children,
}: {
  category?: string;
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.pageShell}>
      <div className={styles.pagePaper}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderMain}>
            {category ? <span className={styles.categoryPill}>{category}</span> : null}
            {title ? <h2 className={styles.pageTitle}>{title}</h2> : null}
          </div>
          {actions ? <div className={styles.pageActions}>{actions}</div> : null}
        </header>
        <div className={styles.pageBody}>{children}</div>
      </div>
    </div>
  );
}
