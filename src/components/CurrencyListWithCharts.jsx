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

// Configuration Chart.js
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

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
          data: values,
          borderColor: "#1976d2",
          fill: false,
          tension: 0.1,
        },
      ],
    };
  };

  // Extraction des noms uniques des paires depuis les données
  const uniquePairs = Array.from(
    new Set(data[0]?.price.map((item) => Object.keys(item)[0]))
  );

  // Extraction du dernier prix d'une paire et calcul du pourcentage de changement sur 24h
  const getLastPriceAndChange = (pairName) => {
    let lastPrice, previousPrice;
    for (let i = data.length - 1; i >= 0; i--) {
      const pair = data[i].price.find((item) => Object.keys(item)[0] === pairName);
      if (pair) {
        if (lastPrice === undefined) {
          lastPrice = Object.values(pair)[0];
        } else {
          previousPrice = Object.values(pair)[0];
          break;
        }
      }
    }

    if (lastPrice && previousPrice) {
      const priceChange = lastPrice - previousPrice;
      const percentageChange = ((priceChange / previousPrice) * 100).toFixed(2);
      return {
        price: lastPrice.toFixed(6),
        change: percentageChange,
        color: priceChange >= 0 ? 'green' : (priceChange < 0 ? 'red' : 'gray')
      };
    }
    return { price: "N/A", change: "0.00", color: 'gray' };
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {uniquePairs.map((pairName) => {
        const { price, change, color } = getLastPriceAndChange(pairName);
        return (
          <div key={pairName} className="col-span-1">
            <div className="card bg-base-100 shadow-xl p-4 mt-6 mb-6 text-base-content">
              <div className="card-body flex flex-row items-center p-4">
                <div className="flex-1 text-left text-white font-semibold text-base-content">
                  {pairName}
                </div>
                <div className="flex-1 text-center font-semibold">
                  {price}
                  <p className={`text-${color}-400 text-center`}>
                    {change}%
                  </p>
                </div>
                <div className="flex-3 h-[144px] w-[144px]">
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
                          ticks: { display: false },
                        },
                        y: {
                          ticks: { display: false },
                        }
                      },
                      elements: {
                        point: {
                          radius: 0
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CurrencyListWithCharts;