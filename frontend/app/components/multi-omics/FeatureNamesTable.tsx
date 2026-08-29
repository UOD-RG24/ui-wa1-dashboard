"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import styles from "./MultiOmics.module.css";

export function FeatureNamesTable({ names }: { names: string[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => names.map((name, i) => ({ id: i, name })), [names]);

  const columns = useMemo<ColumnDef<{ id: number; name: string }>[]>(
    () => [
      { accessorKey: "name", header: "Feature name" },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (names.length === 0) {
    return <p className={styles.tableEmpty}>No feature names in cached results.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.tableFooter}>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({names.length} features)
        </span>
        <span>
          <button type="button" className={styles.secondaryBtn} onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </button>{" "}
          <button type="button" className={styles.secondaryBtn} onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </button>
        </span>
      </div>
    </div>
  );
}
