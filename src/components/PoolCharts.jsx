import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PoolCharts = ({ data }) => {
  const historyChartData = {
    labels: data?.history.map(item => `Epoch ${item.epoch}`) || [],
    datasets: [
      {
        label: 'Active Stake (₳)',
        data: data?.history.map(item => item.activeStake) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

  const rewardsChartData = {
    labels: data?.history.map(item => `Epoch ${item.epoch}`) || [],
    datasets: [
      {
        label: 'Rewards (₳)',
        data: data?.history.map(item => item.rewards) || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };

  const delegatorsChartData = {
    labels: data?.history.map(item => `Epoch ${item.epoch}`) || [],
    datasets: [
      {
        label: 'Delegators Count',
        data: data?.history.map(item => item.delegatorsCount) || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
      },
    ],
  };

  // New chart for fees
  const feesChartData = {
    labels: data?.history.map(item => `Epoch ${item.epoch}`) || [],
    datasets: [
      {
        label: 'Fees (₳)',
        data: data?.history.map(item => item.fees) || [],
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        fill: true,
      },
    ],
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold">Active Stake (₳)</h3>
        <Line data={historyChartData} options={{ responsive: true }} />
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold">Delegators Count</h3>
        <Line data={delegatorsChartData} options={{ responsive: true }} />
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold">Rewards (₳)</h3>
        <Line data={rewardsChartData} options={{ responsive: true }} />
      </div>



      <div className="mb-6">
        <h3 className="text-xl font-semibold">Fees (₳)</h3>
        <Line data={feesChartData} options={{ responsive: true }} />
      </div>
    </div>
  );
};

export default PoolCharts;