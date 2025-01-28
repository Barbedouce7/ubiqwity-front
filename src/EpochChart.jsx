import React from "react";
import { Card, CardContent } from "@mui/material";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  BarController, // Import du contrôleur Bar
  LineController, // Import du contrôleur Line
} from "chart.js";
import { Chart } from "react-chartjs-2";

// Enregistrer tous les modules nécessaires
ChartJS.register(
  LineController,
  BarController,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);


const EpochChart = ({ epochLabels, txCounts, activeStakes }) => {
  const combinedData = {
    labels: epochLabels,
    datasets: [
      {
        type: "bar",
        label: "Transaction Counts",
        data: txCounts,
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        type: "line",
        label: "Active Stakes (M)",
        data: activeStakes,
        borderColor: "rgba(245, 158, 11, 1)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  return (
    <Card class="bg-slate-900 h-auto">
      <CardContent>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Epoch Data Overview</h2>
        <div>
          <Chart
            type="bar"
            data={combinedData}
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

