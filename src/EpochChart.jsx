import React from "react";
import { Line, Bar } from "react-chartjs-2";
import { Card, CardContent } from "@mui/material";

// Enregistrement des éléments nécessaires pour Chart.js
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const EpochChart = ({ epochLabels, txCounts, activeStakes }) => {
  const barData = {
    labels: epochLabels,
    datasets: [
      {
        label: "Transaction Counts",
        data: txCounts,
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: epochLabels,
    datasets: [
      {
        label: "Active Stakes (M)",
        data: activeStakes,
        borderColor: "rgba(245, 158, 11, 1)",
        backgroundColor: "rgba(245, 158, 11, 0.5)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  return (
    <Card style={{ backgroundColor: "#1e293b", color: "white", borderRadius: "12px" }}>
      <CardContent>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Epoch Data Overview</h2>
        <div>
          <Bar
            data={barData}
            options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: "white" } },
              },
              scales: {
                x: { ticks: { color: "white" } },
                y: { ticks: { color: "white" } },
              },
            }}
          />
        </div>
        <div className="mt-8">
          <Line
            data={lineData}
            options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: "white" } },
              },
              scales: {
                x: { ticks: { color: "white" } },
                y: { ticks: { color: "white" } },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default EpochChart;

