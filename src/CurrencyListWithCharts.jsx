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
        <Grid container spacing={4}>
      {uniquePairs.map((pairName) => (
        <Grid item xs={12} key={pairName}>
          <Card className="bg-slate-900 shadow-xl"> {/* Utilisation du fond sombre de DaisyUI */}
            <CardContent className="flex items-center p-4 space-x-4">
              {/* Nom de la paire */}
              <Typography
                variant="h6"
                className="flex-1 text-left text-white font-semibold"
              >
                {pairName}
              </Typography>
              {/* Dernier prix */}
              <Typography
                variant="h6"
                className="flex-1 text-center text-primary font-semibold"
              >
                {getLastPrice(pairName)}
              </Typography>
              {/* Graphique */}
              <div style={{ flex: 3, height: "200px" }}>
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
