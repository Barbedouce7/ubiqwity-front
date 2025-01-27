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

  // Extraction du dernier prix d'une paire
  const getLastPrice = (pairName) => {
    for (let i = data.length - 1; i >= 0; i--) {
      const pair = data[i].price.find((item) => Object.keys(item)[0] === pairName);
      if (pair) return Object.values(pair)[0].toFixed(6); // Format du prix avec 6 décimales
    }
    return "N/A";
  };

  return (
    <Grid container spacing={2}>
      {uniquePairs.map((pairName) => (
        <Grid item xs={12} key={pairName}>
          <Card>
            <CardContent style={{ display: "flex", alignItems: "center" }}>
              {/* Nom de la paire */}
              <Typography
                variant="h6"
                style={{ flex: 1, textAlign: "left", fontWeight: "bold" }}
              >
                {pairName}
              </Typography>
              {/* Dernier prix */}
              <Typography
                variant="h6"
                style={{
                  flex: 1,
                  textAlign: "center",
                  color: "#1976d2",
                  fontWeight: "bold",
                }}
              >
                {getLastPrice(pairName)}
              </Typography>
              {/* Graphique */}
              <div style={{ flex: 3 }}>
                <Line
                  data={prepareChartData(data, pairName)}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      x: {
                        ticks: { display: false }, // Cacher les labels sur l'axe des X
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default CurrencyListWithCharts;
