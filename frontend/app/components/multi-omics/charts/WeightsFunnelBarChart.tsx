import { Bar } from "react-chartjs-2";
import { baseChartOptions } from "../../../lib/chartConfig";
import { chartPrimary, chartSecondary, chartTertiary } from "../../../lib/chartTheme";
import styles from "../MultiOmics.module.css";

export function WeightsFunnelBarChart({
  weightsExtracted = 0,
  selectedWeights = 0,
  selectedFeatures = 0,
}: {
  weightsExtracted?: number;
  selectedWeights?: number;
  selectedFeatures?: number;
}) {
  return (
    <div className={styles.chartFrame} aria-label="Weights funnel">
      <Bar
        data={{
          labels: ["Extracted", "Selected weights", "Selected features"],
          datasets: [
            {
              data: [weightsExtracted, selectedWeights, selectedFeatures],
              backgroundColor: [chartPrimary, chartSecondary, chartTertiary],
              borderRadius: 2,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          plugins: { ...baseChartOptions.plugins, legend: { display: false } },
        }}
      />
    </div>
  );
}

export function SparsityBarChart({ sparsity }: { sparsity: [number, number] }) {
  return (
    <div className={styles.chartFrame} aria-label="Sparsity parameters">
      <Bar
        data={{
          labels: ["Block 1", "Block 2"],
          datasets: [
            {
              data: sparsity,
              backgroundColor: [chartPrimary, chartSecondary],
              borderRadius: 2,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          plugins: { ...baseChartOptions.plugins, legend: { display: false } },
          scales: {
            x: baseChartOptions.scales.x,
            y: { ...baseChartOptions.scales.y, beginAtZero: true, max: 1 },
          },
        }}
      />
    </div>
  );
}
