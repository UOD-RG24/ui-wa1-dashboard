import { Bar } from "react-chartjs-2";
import { baseChartOptions } from "../../../lib/chartConfig";
import { chartPrimary, chartSecondary } from "../../../lib/chartTheme";
import type { BlockDetails } from "../../../lib/multiOmicsTypes";
import styles from "../MultiOmics.module.css";

export function BlockComparisonBarChart({
  blockDetails,
}: {
  blockDetails: Record<string, BlockDetails>;
}) {
  const blocks = Object.keys(blockDetails);
  if (blocks.length === 0) {
    return (
      <div className={styles.chartFrame}>
        <p className={styles.dropzoneHint}>No block details available.</p>
      </div>
    );
  }

  return (
    <div className={styles.chartFrameTall} style={{ border: "1px solid var(--line)", borderRadius: 4, padding: 8 }}>
      <Bar
        data={{
          labels: blocks,
          datasets: [
            {
              label: "Patients",
              data: blocks.map((b) => blockDetails[b]?.patients ?? 0),
              backgroundColor: chartPrimary,
              borderRadius: 2,
            },
            {
              label: "Features",
              data: blocks.map((b) => blockDetails[b]?.features ?? 0),
              backgroundColor: chartSecondary,
              borderRadius: 2,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          plugins: {
            ...baseChartOptions.plugins,
            legend: { display: true, position: "top" },
          },
        }}
      />
    </div>
  );
}
