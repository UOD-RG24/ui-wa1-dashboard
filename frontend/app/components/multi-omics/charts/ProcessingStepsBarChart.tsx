import { Bar } from "react-chartjs-2";
import { baseChartOptions } from "../../../lib/chartConfig";
import { chartPrimary } from "../../../lib/chartTheme";
import type { ProcessStep } from "../../../lib/multiOmicsTypes";
import styles from "../MultiOmics.module.css";

export function ProcessingStepsBarChart({ steps }: { steps: ProcessStep[] }) {
  const labels = steps.map((s, i) => s.step ?? `Step ${i + 1}`);
  const values = steps.map((s) => s.durationMs ?? 0);

  if (steps.length === 0) {
    return (
      <div className={styles.chartFrame}>
        <p className={styles.dropzoneHint}>No step timing data available.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.chartFrame} ${styles.chartFrameTall}`} aria-label="Processing step durations">
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Duration (ms)",
              data: values,
              backgroundColor: chartPrimary,
              borderRadius: 2,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          indexAxis: "y" as const,
          plugins: {
            ...baseChartOptions.plugins,
            legend: { display: false },
          },
          scales: {
            x: { ...baseChartOptions.scales.x, beginAtZero: true },
            y: { ...baseChartOptions.scales.y, grid: { display: false } },
          },
        }}
      />
    </div>
  );
}
