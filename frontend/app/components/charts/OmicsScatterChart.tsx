import { Scatter } from "react-chartjs-2";
import data from "../../data/dashboard.json";
import { baseChartOptions } from "../../lib/chartConfig";
import styles from "./Charts.module.css";

export function OmicsScatterChart({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? `${styles.chartFrame} ${styles.small}` : styles.chartFrame}>
      <Scatter
        data={{
          datasets: [
            {
              data: data.omicsRows.map((row) => ({ x: row.rna, y: row.protein })),
              backgroundColor: "#101d49",
              borderColor: "#101d49",
              pointRadius: 4,
              pointHoverRadius: 5,
            },
          ],
        }}
        options={{
          ...baseChartOptions,
          scales: {
            x: { ...baseChartOptions.scales.x, title: { display: true, text: "RNA", color: "#64748b" } },
            y: { ...baseChartOptions.scales.y, title: { display: true, text: "Protein", color: "#64748b" } },
          },
        }}
      />
    </div>
  );
}
