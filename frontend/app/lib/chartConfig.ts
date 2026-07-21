import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, Tooltip);

export const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#101d49",
      displayColors: false,
      titleFont: { family: "Arial" },
      bodyFont: { family: "Arial" },
    },
  },
  scales: {
    x: {
      grid: { color: "#eef2f6" },
      ticks: { color: "#64748b", font: { family: "Arial", size: 11 } },
    },
    y: {
      grid: { color: "#eef2f6" },
      ticks: { color: "#64748b", font: { family: "Arial", size: 11 } },
    },
  },
};
