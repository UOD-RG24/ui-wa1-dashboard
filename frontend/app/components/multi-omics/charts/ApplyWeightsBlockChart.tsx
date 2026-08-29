import { Bar } from "react-chartjs-2";
import { baseChartOptions } from "../../../lib/chartConfig";
import { chartPrimary, chartSecondary, chartTertiary } from "../../../lib/chartTheme";
import type { ApplyWeightsOutput } from "../../../lib/multiOmicsTypes";
import styles from "../MultiOmics.module.css";

export function ApplyWeightsBlockChart({ outputs }: { outputs: ApplyWeightsOutput[] }) {
  if (outputs.length === 0) {
    return (
      <div className={styles.chartFrame}>
        <p className={styles.dropzoneHint}>No apply-weights output data.</p>
      </div>
    );
  }

  const labels = outputs.map((o, i) => o.block ?? `Block ${i + 1}`);

  return (
    <div className={styles.chartFrameTall} style={{ border: "1px solid var(--line)", borderRadius: 4, padding: 8 }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Samples processed",
              data: outputs.map((o) => o.samplesProcessed ?? 0),
              backgroundColor: chartPrimary,
              borderRadius: 2,
            },
            {
              label: "Features weighted",
              data: outputs.map((o) => o.featuresWeighted ?? 0),
              backgroundColor: chartSecondary,
              borderRadius: 2,
            },
            {
              label: "Zero weighted",
              data: outputs.map((o) => o.zeroWeightedValues ?? 0),
              backgroundColor: chartTertiary,
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

export function FinalMatrixBarChart({
  rowCount = 0,
  columnCount = 0,
  selectedFeatureCount = 0,
}: {
  rowCount?: number;
  columnCount?: number;
  selectedFeatureCount?: number;
}) {
  return (
    <div className={styles.chartFrame} aria-label="Final matrix dimensions">
      <Bar
        data={{
          labels: ["Rows", "Columns", "Selected features"],
          datasets: [
            {
              data: [rowCount, columnCount, selectedFeatureCount],
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

export function DefinedMatrixComparisonChart({
  blocks,
}: {
  blocks: { label: string; selected: number; total: number }[];
}) {
  if (blocks.length === 0) {
    return (
      <div className={styles.chartFrame}>
        <p className={styles.dropzoneHint}>No defined matrix comparison data.</p>
      </div>
    );
  }

  return (
    <div className={styles.chartFrame} aria-label="Defined matrix feature comparison">
      <Bar
        data={{
          labels: blocks.map((b) => b.label),
          datasets: [
            {
              label: "Selected",
              data: blocks.map((b) => b.selected),
              backgroundColor: chartPrimary,
              borderRadius: 2,
            },
            {
              label: "Remaining",
              data: blocks.map((b) => Math.max(0, b.total - b.selected)),
              backgroundColor: "#c5ced9",
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
