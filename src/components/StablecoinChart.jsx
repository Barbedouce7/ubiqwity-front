import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, annotationPlugin);

// Custom plugin to draw a vertical line on hover
const verticalLinePlugin = {
  id: "verticalLineOnHover",
  afterDraw(chart) {
    const { ctx, tooltip, chartArea } = chart;
    if (tooltip._active && tooltip._active.length) {
      const activePoint = tooltip._active[0];
      const x = activePoint.element.x;
      const topY = chartArea.top;
      const bottomY = chartArea.bottom;

      // Determine line color based on background (simplified detection)
      const isDarkTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const lineColor = isDarkTheme ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 1)"; // White on dark, black on light

      // Draw vertical line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 2;
      ctx.strokeStyle = lineColor;
      ctx.stroke();
      ctx.restore();
    }
  },
};

ChartJS.register(verticalLinePlugin);

const StablecoinChart = ({ data }) => {
  const stablecoins = ["ADA-DJED", "ADA-iUSD", "ADA-USDM"];
  
  const colors = {
    "ADA-DJED": { border: "rgba(189, 179, 26, 1)", background: "rgba(189, 179, 26, 0.2)" }, // Yellow
    "ADA-iUSD": { border: "rgba(128, 0, 128, 1)", background: "rgba(128, 0, 128, 0.2)" }, // Purple
    "ADA-USDM": { border: "rgba(13, 74, 223, 1)", background: "rgba(0, 0, 255, 0.2)" }, // Blue
  };
  
  const prepareChartData = () => {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("StablecoinChart: No valid data provided");
      return { labels: [], datasets: [] };
    }
    
    const labels = data.map(item => {
      if (!item?.date) {
        console.warn("StablecoinChart: Missing date in item", item);
        return "Unknown";
      }
      return new Date(item.date).toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true, // Use AM/PM format
      });
    });
    
    const datasets = stablecoins.map(pair => {
      const prices = data.map(item => {
        if (!item?.prices || typeof item.prices !== "object") {
          console.warn("StablecoinChart: Missing or invalid prices object in item", item);
          return null;
        }
        const stablecoinPrice = item.prices[pair] || null;
        const adaUsdPrice = item.prices["ADA-USD"] || null;
        
        if (stablecoinPrice && adaUsdPrice) {
          const priceInUsd = (1 / stablecoinPrice) * adaUsdPrice;
          return Number(priceInUsd.toFixed(4));
        }
        return null;
      });
      
      return {
        label: pair.replace("ADA-", ""),
        data: prices,
        borderColor: colors[pair].border,
        backgroundColor: colors[pair].background,
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.1,
      };
    });
    
    return {
      labels,
      datasets,
    };
  };
  
  const chartData = prepareChartData();
  
  if (chartData.labels.length === 0) {
    return (
      <div className="rounded-xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-base-content mb-6">Stablecoins PEG</h2>
        <p className="text-center text-gray-500">No data available for the chart</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-base-content mb-6">Stablecoins PEG</h2>
      <div className="h-[400px]">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Date",
                  font: { size: 12, weight: "bold" },
                },
                ticks: { maxTicksLimit: 10 },
                grid: { color: "rgba(0, 0, 0, 0.1)" },
              },
              y: {
                title: {
                  display: true,
                  text: "Price (USD)",
                  font: { size: 12, weight: "bold" },
                },
                suggestedMin: 0.95,
                suggestedMax: 1.05,
                grid: { color: "rgba(0, 0, 0, 0.1)" },
                ticks: {
                  callback: function(value) {
                    return "$" + value.toFixed(3);
                  },
                },
              },
            },
            plugins: {
              legend: {
                display: true,
                position: "top",
                labels: { padding: 20, usePointStyle: true, font: { size: 12 } },
              },
              tooltip: {
                enabled: true,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                titleColor: "white",
                bodyColor: "white",
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderWidth: 1,
                callbacks: {
                  label: (context) => {
                    const label = context.dataset.label || "";
                    const value = parseFloat(context.parsed.y);
                    return `${label}: $${value.toFixed(4)}`;
                  },
                },
              },
              annotation: {
                annotations: {
                  line1: {
                    type: "line",
                    yMin: 1,
                    yMax: 1,
                    borderColor: "rgba(255, 0, 0, 1)", // Red line
                    borderWidth: 1,
                  },
                },
              },
            },
            interaction: { intersect: false, mode: "index" },
          }}
        />
      </div>
    </div>
  );
};

export default StablecoinChart;