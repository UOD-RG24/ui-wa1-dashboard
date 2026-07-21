import { Scatter } from "react-chartjs-2";
import data from "../../data/dashboard.json";
import { baseChartOptions } from "../../lib/chartConfig";
import styles from "./Charts.module.css";

export function VolcanoChart() {
  const volcanoPoints = data.omicsRows.flatMap((row, index) => [
    { x: row.rna, y: 1.2 + index * 0.38 },
    { x: -row.protein, y: 1.5 + index * 0.32 },
  ]);

  return (
    <div className={styles.chartFrame}>
      <Scatter
        data={{
          datasets: [
            {
              data: volcanoPoints,
              backgroundColor: "#365b8f",
              borderColor: "#365b8f",
              pointRadius: 4,
              pointHoverRadius: 5,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          scales: {
            x: { ...baseChartOptions.scales.x, title: { display: true, text: "log2 fold change", color: "#64748b" } },
            y: { ...baseChartOptions.scales.y, beginAtZero: true, title: { display: true, text: "-log10 p", color: "#64748b" } },
          },
        }}
      />
    </div>
  );
}
