import React, { useState, useEffect, useCallback } from "react";
import { Chart } from "react-chartjs-2";


const EpochChart = ({ epochLabels, txCounts, activeStakes }) => {
  const detectTheme = useCallback(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      return document.documentElement.classList.contains("dark") || 
             document.documentElement.classList.contains("vibrant") 
             ? "dark" 
             : "light";
    }
    return "light";
  }, []);

  const [theme, setTheme] = useState(detectTheme());

  // Met à jour immédiatement le thème si la détection initiale est incorrecte
  useEffect(() => {
    setTheme(detectTheme());
  }, [detectTheme]);

  // Surveiller les changements de thème dynamiquement
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(detectTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [detectTheme]);

  const colorText = theme === "dark" ? "#f8f9fa" : "#212529";

  const combinedData = {
    labels: epochLabels,
    datasets: [
      {
        type: "bar",
        label: "Transaction Counts",
        data: (txCounts || []).map((value) => value / 1_000),
        borderColor: "rgba(52, 165, 230, 1)",
        backgroundColor: "rgba(52, 165, 230, 0.9)",
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
    <div className="p-2 text-base-content">
      <Chart
        type="bar"
        data={combinedData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: colorText, // Couleur des labels de la légende
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: colorText, // Couleur des labels de l'axe X
              },
            },
            y1: { 
              type: "linear",
              position: "left",
              ticks: {
                color: colorText, // Couleur des labels de l'axe Y gauche
              },
            },
            y2: { 
              type: "linear",
              position: "right",
              ticks: {
                color: colorText, // Couleur des labels de l'axe Y droit
              },
            },
          },
        }}
      />
    </div>
  );
};

export default EpochChart;