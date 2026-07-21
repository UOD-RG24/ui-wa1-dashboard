import { Bar } from "react-chartjs-2";
import { baseChartOptions } from "../../lib/chartConfig";
import styles from "./Charts.module.css";

export function StageSparkline({ stages }: { stages: number[] }) {
  return (
    <div className={`${styles.chartFrame} ${styles.sparkline}`} aria-label="Stage distribution">
      <Bar
        data={{
          labels: ["I", "II", "III", "IV"],
          datasets: [
            {
              data: stages,
              backgroundColor: "#8fa3b8",
              borderColor: "#101d49",
              borderWidth: 1,
              borderRadius: 2,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          scales: {
            x: { ...baseChartOptions.scales.x, grid: { display: false } },
            y: { ...baseChartOptions.scales.y, beginAtZero: true, ticks: { display: false }, grid: { display: false } },
          },
        }}
      />
    </div>
  );
}
