import React, { useState, useRef, useEffect } from "react";
import { useParams, Link } from 'react-router-dom';
import { shortener } from '../utils/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bubble } from "react-chartjs-2";

// Enregistrer les composants nécessaires de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const generateRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsla(${hue}, 70%, 50%, 0.7)`;
};

const generateWalletColors = (wallets) => {
  return wallets.reduce((acc, wallet) => {
    acc[wallet[0]] = generateRandomColor();
    return acc;
  }, {});
};

const WalletFriends = ({ stakekey, friendsData }) => {
  if (!friendsData) {
    return <p className="text-error">No data available.</p>;
  }

  const sortedStakeKeys = Object.entries(friendsData.stakeKeyFrequency).sort(
    (a, b) => b[1] - a[1]
  );

  const [walletColors, setWalletColors] = useState(() => 
    generateWalletColors(sortedStakeKeys)
  );

  const maxFrequency = sortedStakeKeys[0]?.[1] || 1;

  // Configuration du bubble chart pour Chart.js
  const chartData = {
    datasets: [{
      data: sortedStakeKeys.map((wallet, index) => ({
        x: index,
        y: wallet[1],
        r: (wallet[1] / maxFrequency) * 20 + 5 // Taille relative de la bulle
      })),
      backgroundColor: sortedStakeKeys.map(wallet => walletColors[wallet[0]]),
      borderColor: 'transparent',
      hoverBackgroundColor: sortedStakeKeys.map(wallet => walletColors[wallet[0]].replace('0.7', '1')),
    }]
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Frequency'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Wallets'
        },
        ticks: {
          callback: function(value) {
            return shortener(sortedStakeKeys[value]?.[0] || '');
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const index = context.dataIndex;
            const stakeKey = sortedStakeKeys[index][0];
            const frequency = sortedStakeKeys[index][1];
            return [
              `Wallet: ${shortener(stakeKey)}`,
              `Frequency: ${frequency}`
            ];
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  const refreshColors = () => {
    setWalletColors(generateWalletColors(sortedStakeKeys));
  };

  return (
    <div className="space-y-8 p-4">
      {/* Bubble Chart */}
      <div className="w-full card bg-base-100">
        <div className="card-body p-4">
          <Bubble data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Color Refresh Button */}
      <div className="flex justify-center">
        <button 
          onClick={refreshColors}
          className="btn btn-primary gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Random color
        </button>
      </div>

      {/* Wallet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedStakeKeys.map(([stakeKey, frequency]) => (
          <div key={stakeKey} className="card bg-base-100 shadow-xl">
            <div
              className="h-2 rounded-t-2xl"
              style={{ 
                width: `${(frequency / maxFrequency) * 100}%`,
                backgroundColor: walletColors[stakeKey]
              }}
            ></div>
            <div className="card-body p-4">
              <h3 className="card-title break-all">
                <Link 
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: walletColors[stakeKey] }}
                  to={`/wallet/${stakeKey}`}
                >
                  {shortener(stakeKey)}
                </Link>
              </h3>
              <p className="text-gray-500 opacity-80">Frequency : {frequency}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletFriends;