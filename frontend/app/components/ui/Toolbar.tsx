import data from "../../data/dashboard.json";
import styles from "./Ui.module.css";

export function Toolbar() {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        <label>
          Cohort
          <select defaultValue="BRCA">
            <option>BRCA</option>
            <option>COAD</option>
            <option>LUAD</option>
            <option>GBM</option>
          </select>
        </label>
        <label>
          Stage
          <select defaultValue="Stage II">
            <option>All stages</option>
            <option>Stage I</option>
            <option>Stage II</option>
            <option>Stage III</option>
            <option>Stage IV</option>
          </select>
        </label>
        <label>
          Workspace
          <select defaultValue="EXP-042">
            {data.experiments.map((experiment) => (
              <option key={experiment.id}>{experiment.id}</option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.toolbarActions}>
        <button className={styles.button}>Export</button>
        <button className={styles.primaryAction}>Run update</button>
      </div>
    </div>
  );
}
