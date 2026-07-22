import styles from "./Ui.module.css";

export function DataTable<T extends Record<string, unknown>>({ rows, columns }: { rows: T[]; columns: string[] }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{columns.map((column) => <td key={column}>{String(row[column] ?? "")}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
