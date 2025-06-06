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

      const isDarkTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const lineColor = isDarkTheme ? "rgba(125, 125, 125, 1)" : "rgba(0, 0, 0, 1)";

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = lineColor;
      ctx.stroke();
      ctx.restore();
    }
  },
};

// Custom plugin to draw vertical grid lines at date changes
const dateChangeGridPlugin = {
  id: "dateChangeGrid",
  afterDraw(chart) {
    const { ctx, scales, chartArea, data } = chart;
    const xScale = scales.x;
    const labels = data.labels;
    const originalDates = data.originalDates || [];

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";

    for (let i = 1; i < originalDates.length; i++) {
      if (!originalDates[i] || !originalDates[i - 1]) continue;
      const currentDate = new Date(originalDates[i]).toISOString().split("T")[0];
      const prevDate = new Date(originalDates[i - 1]).toISOString().split("T")[0];
      if (currentDate !== prevDate) {
        const x = xScale.getPixelForTick(i);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
      }
    }
    ctx.restore();
  },
};

ChartJS.register(verticalLinePlugin, dateChangeGridPlugin);

const StablecoinChart = ({ data }) => {
  const stablecoins = ["ADA-DJED", "ADA-iUSD", "ADA-USDM"];

  const colors = {
    "ADA-DJED": { border: "rgba(189, 179, 26, 1)", background: "rgba(189, 179, 26, 0.2)" },
    "ADA-iUSD": { border: "rgba(128, 0, 128, 1)", background: "rgba(128, 0, 128, 0.2)" },
    "ADA-USDM": { border: "rgba(13, 74, 223, 1)", background: "rgba(0, 0, 255, 0.2)" },
  };

  const prepareChartData = () => {
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("StablecoinChart: No valid data provided");
      return { labels: [], datasets: [], originalDates: [] };
    }

    const labels = [];
    const originalDates = [];

    data.forEach(item => {
      if (!item?.date) {
        console.warn("StablecoinChart: Missing date in item", item);
        labels.push("Unknown");
        originalDates.push(null);
        return;
      }

      const date = new Date(item.date);
      if (isNaN(date.getTime())) {
        console.warn("StablecoinChart: Invalid date in item", item.date);
        labels.push("Unknown");
        originalDates.push(null);
        return;
      }

      labels.push(
        date.toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
      originalDates.push(item.date);
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
        borderWidth: 1,
        pointRadius: 1,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.1,
      };
    });

    return {
      labels,
      datasets,
      originalDates,
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
                  display: false,
                  text: "Date",
                  font: { size: 12, weight: "bold" },
                },
                ticks: { maxTicksLimit: 10 },
                grid: {
                  display: false,
                },
              },
              y: {
                title: {
                  display: false,
                  text: "Price (USD)",
                  font: { size: 12, weight: "bold" },
                },
                suggestedMin: 0.95,
                suggestedMax: 1.05,
                grid: { color: "rgba(0, 0, 0, 0.1)" },
                ticks: {
                  callback: function (value) {
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
                borderColor: "rgba(125, 125, 125, 0.2)",
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
                    borderColor: "rgba(255, 0, 0, 1)",
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