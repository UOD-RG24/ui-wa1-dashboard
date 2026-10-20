"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import styles from "./MultiOmics.module.css";

export function VirtualizedFeatureCheckboxList({
  features,
  selected,
  onChange,
}: {
  features: string[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [filter, setFilter] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return features;
    return features.filter((f) => f.toLowerCase().includes(q));
  }, [features, filter]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 12,
  });

  const toggle = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    onChange(next);
  };

  const selectAll = () => onChange(new Set(filtered));
  const clearAll = () => {
    const next = new Set(selected);
    for (const f of filtered) next.delete(f);
    onChange(next);
  };

  return (
    <div className={styles.featureListWrap}>
      <div className={styles.featureListToolbar}>
        <input
          type="search"
          placeholder="Filter features…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button type="button" className={styles.secondaryBtn} onClick={selectAll}>
          Select all
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={clearAll}>
          Clear all
        </button>
        <span className={styles.timestamp}>
          {selected.size} selected / {features.length} total
        </span>
      </div>
      <div ref={parentRef} style={{ height: 280, overflow: "auto" }}>
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((item) => {
            const name = filtered[item.index];
            return (
              <div
                key={name}
                className={styles.featureRow}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <label>
                  <input type="checkbox" checked={selected.has(name)} onChange={() => toggle(name)} />
                  {name}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
