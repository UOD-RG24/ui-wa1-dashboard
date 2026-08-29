import { Doughnut } from "react-chartjs-2";
import { baseChartOptions } from "../../../lib/chartConfig";
import { chartGrid, chartMuted, chartPrimary } from "../../../lib/chartTheme";
import styles from "../MultiOmics.module.css";

export function RgccaHealthDoughnutChart({ healthy }: { healthy: boolean }) {
  return (
    <div className={styles.chartFrame} aria-label="RGCCA service health">
      <Doughnut
        data={{
          labels: ["Healthy", "Unhealthy"],
          datasets: [
            {
              data: healthy ? [1, 0] : [0, 1],
              backgroundColor: [chartPrimary, chartMuted],
              borderWidth: 0,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          cutout: "65%",
          plugins: {
            ...baseChartOptions.plugins,
            legend: { display: true, position: "bottom" },
          },
        }}
      />
    </div>
  );
}

export function FeatureColumnDoughnutChart({
  featureCount = 0,
  excludedColumnCount = 0,
  totalColumnCount = 0,
}: {
  featureCount?: number;
  excludedColumnCount?: number;
  totalColumnCount?: number;
}) {
  const remaining = Math.max(0, totalColumnCount - featureCount - excludedColumnCount);
  return (
    <div className={styles.chartFrame} aria-label="Feature column breakdown">
      <Doughnut
        data={{
          labels: ["Features", "Excluded", "Other"],
          datasets: [
            {
              data: [featureCount, excludedColumnCount, remaining],
              backgroundColor: ["#101d49", "#365b8f", "#8fa3b8"],
              borderColor: chartGrid,
              borderWidth: 1,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          cutout: "55%",
          plugins: {
            ...baseChartOptions.plugins,
            legend: { display: true, position: "bottom" },
          },
        }}
      />
    </div>
  );
}
