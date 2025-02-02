import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const CurrencyListWithCharts = ({ data }) => {
  const prepareChartData = (priceData, pairName) => {
    const timestamps = priceData.map(entry => new Date(entry.date).toLocaleTimeString());
    const values = priceData.map(entry => {
      const pair = entry.price.find(item => Object.keys(item)[0] === pairName);
      return pair ? Object.values(pair)[0] : null;
    });

    return {
      labels: timestamps,
      datasets: [{
        data: values,
        borderColor: "#1976d2",
        fill: false,
        tension: 0.1,
      }],
    };
  };

  const uniquePairs = Array.from(new Set(data[0]?.price.map(item => Object.keys(item)[0])));

  const getPriceAndChange = (pairName) => {
    if (data.length < 2) return { price: "N/A", change: "0.00", color: 'gray' };

    const latest = data[data.length - 1].price.find(item => Object.keys(item)[0] === pairName);
    const first = data[0].price.find(item => Object.keys(item)[0] === pairName);

    if (!latest || !first) return { price: "N/A", change: "0.00", color: 'gray' };

    const lastPrice = Object.values(latest)[0];
    const firstPrice = Object.values(first)[0];
    const priceChange = lastPrice - firstPrice;
    const percentageChange = ((priceChange / firstPrice) * 100).toFixed(2);

    return {
      price: lastPrice.toFixed(6),
      change: percentageChange,
      color: priceChange >= 0 ? 'green' : 'red'
    };
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {uniquePairs.map(pairName => {
        const { price, change, color } = getPriceAndChange(pairName);
        return (
          <div key={pairName} className="bg-base-100 shadow-md mt-2 p-2 flex items-center">
            <div className="w-1/3 text-left text-base-content font-semibold">{pairName}</div>
            <div className="w-1/3 text-center font-semibold">
              {price}
              <p className={`text-${color}-500 text-sm`}>{change}%</p>
            </div>
            <div className="w-1/3 h-[80px]">
              <Line
                data={prepareChartData(data, pairName)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    x: { display: false },
                    y: { display: false }
                  },
                  elements: {
                    point: { radius: 0 }
                  }
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CurrencyListWithCharts;