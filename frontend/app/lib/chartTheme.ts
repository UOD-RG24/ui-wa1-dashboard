/** Navy-only chart palette — matches globals-dashboard.css tokens */

export const chartPrimary = "#101d49";
export const chartSecondary = "#365b8f";
export const chartTertiary = "#506074";
export const chartQuaternary = "#8fa3b8";
export const chartMuted = "#c5ced9";
export const chartGrid = "#eef2f6";

export const chartSeries = [chartPrimary, chartSecondary, chartTertiary, chartQuaternary] as const;

export function seriesColor(index: number): string {
  return chartSeries[index % chartSeries.length];
}
