"use client";

import { useMemo, useState } from "react";
import styles from "./SortableDataTable.module.css";
import ui from "./Ui.module.css";

type SortDirection = "asc" | "desc";

export function SortableDataTable<T extends Record<string, unknown>>({
  rows,
  columns,
}: {
  rows: T[];
  columns: Array<{ key: keyof T & string; label: string }>;
}) {
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? "");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((left, right) => {
      const a = left[sortKey];
      const b = right[sortKey];
      if (typeof a === "number" && typeof b === "number") {
        return sortDirection === "asc" ? a - b : b - a;
      }
      return sortDirection === "asc"
        ? String(a ?? "").localeCompare(String(b ?? ""))
        : String(b ?? "").localeCompare(String(a ?? ""));
    });
    return copy;
  }, [rows, sortDirection, sortKey]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  return (
    <div className={ui.tableWrap}>
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                <button className={styles.sortButton} type="button" onClick={() => toggleSort(column.key)}>
                  {column.label}
                  {sortKey === column.key ? <span>{sortDirection === "asc" ? " ↑" : " ↓"}</span> : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key}>{String(row[column.key] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
