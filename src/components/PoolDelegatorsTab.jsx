import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import GetHandle from './GetHandle';
import CopyButton from './CopyButton';
import { shortener } from '../utils/utils';
import { FormatNumberWithSpaces } from '../utils/FormatNumberWithSpaces';
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

const generateDelegatorColors = (delegators) => {
  return delegators.reduce((acc, delegator) => {
    acc[delegator.address] = generateRandomColor();
    return acc;
  }, {});
};

const PoolDelegatorsTab = ({ delegators }) => {
  const sortedDelegators = [...delegators].sort((a, b) => b.liveStake - a.liveStake);
  const totalStake = sortedDelegators.reduce((sum, d) => sum + d.liveStake, 0);
  
  const [delegatorColors, setDelegatorColors] = useState(() => 
    generateDelegatorColors(sortedDelegators)
  );

  const maxStake = sortedDelegators[0]?.liveStake || 1;

  // Bubble chart configuration
  const chartData = {
    datasets: [{
      data: sortedDelegators.map((delegator, index) => ({
        x: index,
        y: delegator.liveStake,
        r: (delegator.liveStake / maxStake) * 20 + 5
      })),
      backgroundColor: sortedDelegators.map(delegator => delegatorColors[delegator.address]),
      borderColor: 'transparent',
      hoverBackgroundColor: sortedDelegators.map(
        delegator => delegatorColors[delegator.address].replace('0.7', '1')
      ),
    }]
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Live Stake (₳)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Delegators'
        },
        ticks: {
          callback: function(value) {
            return shortener(sortedDelegators[value]?.address || '');
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
            const delegator = sortedDelegators[index];
            return [
              `Wallet: ${shortener(delegator.address)}`,
              `Stake: ${FormatNumberWithSpaces(delegator.liveStake)} ₳`
            ];
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  const refreshColors = () => {
    setDelegatorColors(generateDelegatorColors(sortedDelegators));
  };

  return (
    <div className="space-y-8 p-4">
      <h2 className="text-xl font-semibold mb-4">Delegators Live Stake Distribution</h2>

      {/* Bubble Chart */}
      <div className="w-full  card bg-base-100">
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

      {/* Delegators List */}
      <div className="p-0">
        {sortedDelegators.map((delegator, index) => {
          const stakeKey = delegator.address;
          const stakePercentage = totalStake > 0 ? (delegator.liveStake / totalStake) * 100 : 0;
          return (
            <div key={index} className="mb-4 rounded-lg bg-base-100 p-4 relative shadow-lg">
              <div
                className="absolute top-0 left-0 h-full max-h-[10px] rounded-l-lg"
                style={{ 
                  width: `${stakePercentage}%`,
                  backgroundColor: delegatorColors[stakeKey]
                }}
              ></div>
              <div className="relative z-10 flex justify-between items-center">
                <GetHandle stakekey={stakeKey} />
                <p className="text-sm font-semibold text-gray-700">
                  <FormatNumberWithSpaces number={delegator.liveStake} /> ₳
                </p>
              </div>
              <p className="text-lg">
                <Link 
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: delegatorColors[stakeKey] }}
                  to={`/wallet/${stakeKey}`}
                >
                  {shortener(stakeKey)}
                </Link>
                <CopyButton text={stakeKey} />
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PoolDelegatorsTab;