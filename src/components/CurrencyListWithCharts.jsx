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

const CurrencyListWithCharts = ({ data, circulatingSupply }) => {
  const prepareChartData = (prices, labels) => {
    if (!prices.length || !labels.length) return null;
    
    const validData = prices.reduce((acc, price, index) => {
      if (price !== null) {
        acc.labels.push(labels[index]);
        acc.data.push(price);
      }
      return acc;
    }, { labels: [], data: [] });

    return validData.data.length > 0 ? {
      labels: validData.labels,
      datasets: [{
        data: validData.data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0
      }],
    } : null;
  };

  const getPriceChange = (latestPrice, initialPrice) => {
    if (!latestPrice || !initialPrice) return { change: "N/A", color: "gray" };
    const change = (((latestPrice - initialPrice) / initialPrice) * 100).toFixed(2);
    return { change, color: change >= 0 ? "green" : "red" };
  };

  const stablecoins = ["iUSD", "DJED", "USDM"];
  const adaUsdPrice = data[0]?.price.find(item => item["ADA-USD"])?.["ADA-USD"] || 0;
  const dates = data.map(item => new Date(item.date).toLocaleTimeString());
  
  return (
    <div className="grid grid-cols-1 gap-2">
      {data.map((currencyData, index) => {
        const pairName = Object.keys(currencyData.price[0])[0];
        if (!pairName) return null; 
        const prices = data.map(item => item.price.find(p => p[pairName])?.[pairName] || null);
        
        if (!prices.some(price => price !== null)) return null; 

        const latestPrice = prices[prices.length - 1];
        const initialPrice = prices[0];
        const { change, color } = getPriceChange(latestPrice, initialPrice);
        
        const chartData = prepareChartData(prices, dates);
        
        return (
          <div key={index} className="shadow-md mt-2 p-2 flex items-center rounded-lg">
            <div className="w-1/4 text-base-content font-semibold">
              <p>{pairName}</p>
            </div>
            <div className="w-1/4 text-center font-semibold text-base-content">
              {latestPrice ? `$ ${latestPrice.toFixed(4)}` : "N/A"}
            </div>
            <div className="w-1/4 text-center font-semibold text-base-content">
              <p className={`text-sm text-${color}`}>{change}%</p>
            </div>
            <div className="w-1/3 h-[80px]">
              {chartData ? (
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { display: false },
                      y: { display: false }
                    },
                    plugins: {
                      tooltip: { enabled: false },
                      legend: { display: false }
                    }
                  }}
                />
              ) : (
                <p className="text-xs text-gray-500">No data available</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CurrencyListWithCharts;
