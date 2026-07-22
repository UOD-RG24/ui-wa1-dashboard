import styles from "./Ui.module.css";

const heatmapValues = [
  [0.72, 0.61, 0.45, 0.82, 0.32, 0.58],
  [0.28, 0.36, 0.77, 0.64, 0.51, 0.22],
  [0.86, 0.73, 0.52, 0.41, 0.66, 0.91],
  [0.38, 0.47, 0.25, 0.69, 0.74, 0.53],
  [0.57, 0.81, 0.63, 0.29, 0.35, 0.48],
];

export function MiniHeatmap({ variant = "rna" }: { variant?: "rna" | "protein" }) {
  return (
    <div className={styles.heatmap}>
      {heatmapValues.flatMap((row, rowIndex) =>
        row.map((value, colIndex) => (
          <span
            key={`${rowIndex}-${colIndex}`}
            className={styles[variant]}
            style={{ opacity: 0.28 + value * 0.72 }}
          />
        )),
      )}
    </div>
  );
}
