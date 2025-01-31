import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import GetHandle from './GetHandle';
import CopyButton from './CopyButton';

// Register chart.js components for the bar chart
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PoolDelegatorsTab = ({ delegators }) => {
  // Sort delegators by live stake in descending order
  const sortedDelegators = [...delegators].sort((a, b) => b.liveStake - a.liveStake);

  const liveStakeChartData = {
    labels: sortedDelegators.map(d => d.address.slice(0, 6) + '...'), // Use first 6 characters of address for labels
    datasets: [
      {
        label: 'Live Stake (₳)',
        data: sortedDelegators.map(d => d.liveStake),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Delegators Live Stake Distribution</h2>
      <div className="mb-6">
        <Bar data={liveStakeChartData} options={{
          indexAxis: 'x',
          responsive: true,
          scales: {
            x: {
              beginAtZero: true
            }
          }
        }} />
      </div>
      
      <div className="overflow-auto max-h-96">
        {sortedDelegators.map((delegator, index) => {
          const stakeKey = delegator.address;
          return (
            <div key={index} className="mb-4 rounded-lg bg-slate-900 p-4">
              <GetHandle stakekey={stakeKey} />
              <p className="text-lg">
                Address: <CopyButton text={stakeKey} /> {stakeKey}
              </p>
              <p className="text-sm">Live Stake: {delegator.liveStake} ₳</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PoolDelegatorsTab;