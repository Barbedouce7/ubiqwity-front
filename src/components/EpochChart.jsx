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
  BarController,
  LineController, 
  Filler
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  LineController,
  BarController,
  LineElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);


const EpochChart = ({ epochLabels, txCounts, activeStakes }) => {
  const combinedData = {
    labels: epochLabels,
    datasets: [
      {
        type: "bar",
        label: "Transaction Counts",
        data: (txCounts || []).map((value) => value / 1_000),
        borderColor: "rgba(52, 165, 230, 1)",
        backgroundColor: "rgba(52, 165, 230, 0.9",
        borderWidth: 1,
        yAxisID: "y1",
        borderRadius: 10,

      },
      {
        type: "line",
        label: "Active Stake",
        data: (activeStakes || []).map((value) => value / 1_000_000_000),
        borderColor: "rgba(245, 158, 11, 1)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        yAxisID: "y2",
      },
    ],
  };

  return (
        <div  className="bg-base-100 p-2 text-base-content min-h-24">
          <Chart
            type="bar"
            data={combinedData}
            options={{
              responsive: true,
              scales: {
                y1: { 
                  type: "linear",
                  position: "left",
                },
                y2: { 
                  type: "linear",
                  position: "right",
                },
              },
            }}
          />
        </div>
  );
};



export default EpochChart;

