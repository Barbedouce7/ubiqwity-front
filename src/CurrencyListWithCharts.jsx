import React from "react";
import { Line } from "react-chartjs-2";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

// Configuration Chart.js
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

// Composant principal
const CurrencyListWithCharts = ({ data }) => {
  // Fonction pour transformer les données pour chaque paire
  const prepareChartData = (priceData, pairName) => {
    const timestamps = data.map((entry) => new Date(entry.date).toLocaleTimeString());
    const values = data.map((entry) => {
      const pair = entry.price.find((item) => Object.keys(item)[0] === pairName);
      return pair ? Object.values(pair)[0] : null;
    });

    return {
      labels: timestamps,
      datasets: [
        {
          label: `(${pairName})`,
          data: values,
          borderColor: "#1976d2",
          backgroundColor: "rgba(25, 118, 210, 0.2)",
          fill: true,
        },
      ],
    };
  };

  // Extraction des noms uniques des paires depuis les données
  const uniquePairs = Array.from(
    new Set(data[0]?.price.map((item) => Object.keys(item)[0]))
  );

  return (
    <Grid container spacing={2}>
      {uniquePairs.map((pairName) => (
        <Grid item xs={12} md={6} lg={4} key={pairName}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {pairName}
              </Typography>
              <Line data={prepareChartData(data, pairName)} options={{ responsive: true }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default CurrencyListWithCharts;
