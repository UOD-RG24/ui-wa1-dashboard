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
import { useCallback, useMemo, useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { useAppShell } from "../providers/AppProviders";
import { ApiError } from "../../lib/apiClient";
import { deleteExperimentBlob } from "../../lib/multiOmicsApi";
import type { Blob } from "../../lib/multiOmicsTypes";
import { ConfirmModalModel } from "../../models/modal";
import styles from "./MultiOmics.module.css";

function formatKb(bytes?: number) {
  if (bytes == null) return "—";
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function BlobInventoryTable({
  experimentId,
  blobs,
  onChanged,
  onError,
}: {
  experimentId: string;
  blobs: Blob[];
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const { showModal } = useAppShell();
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleDelete = useCallback(
    (blob: Blob) => {
      showModal(
        new ConfirmModalModel({
          title: "Delete blob",
          description: `Remove "${blob.fileName ?? blob.id}"? This cannot be undone.`,
          onYes: () => {
            void (async () => {
              try {
                await deleteExperimentBlob(experimentId, blob.id);
                onChanged();
              } catch (err) {
                onError(err instanceof ApiError ? err.message : "Delete failed.");
              }
            })();
          },
        }),
      );
    },
    [experimentId, onChanged, onError, showModal],
  );

  const columns = useMemo<ColumnDef<Blob>[]>(
    () => [
      {
        accessorKey: "fileName",
        header: "File name",
        cell: (info) => info.getValue<string>() ?? "—",
      },
      {
        accessorKey: "extension",
        header: "Extension",
        cell: (info) => info.getValue<string | null>() ?? "—",
      },
      {
        id: "size",
        header: "Size (KB)",
        accessorFn: (row) => formatKb(row.fileSizeBytes),
      },
      {
        accessorKey: "createdAt",
        header: "Uploaded",
        cell: (info) => {
          const v = info.getValue<string>();
          return v ? new Date(v).toLocaleString() : "—";
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Delete blob"
            onClick={() => handleDelete(row.original)}
          >
            <FiTrash2 />
          </button>
        ),
      },
    ],
    [handleDelete],
  );

  const table = useReactTable({
    data: blobs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  });

  if (blobs.length === 0) {
    return <p className={styles.tableEmpty}>No blobs uploaded yet.</p>;
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
                  {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? null}
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
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <span>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>{" "}
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </span>
      </div>
    </div>
  );
}
