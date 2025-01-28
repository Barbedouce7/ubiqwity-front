import React from "react";
import { Line, Bar } from "react-chartjs-2";
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
  const combinedData = {
    labels: epochLabels,
    datasets: [
      {
        type: "bar",
        label: "Transaction Counts",
        data: txCounts,
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
      {
        type: "line",
        label: "Active Stakes (M)",
        data: activeStakes,
        borderColor: "rgba(245, 158, 11, 1)",
        backgroundColor: "rgba(245, 158, 11, 0.5)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        fill: true, // Pour ajouter un effet de remplissage sous la courbe
      },
    ],
  };

  return (
    <Card style={{ color: "white", borderRadius: "12px" }}>
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

