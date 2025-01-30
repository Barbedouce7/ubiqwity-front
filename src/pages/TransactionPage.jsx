import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Enregistrement des composants de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

function PoolPage({ data }) {
  // Utilisation de useState pour gérer les données localement
  const [poolData, setPoolData] = useState({});

  useEffect(() => {
    // Si les données sont passées via les props, on les met à jour dans le state local
    if (data) {
      setPoolData(data);
    }
  }, [data]);

  // Préparation des données pour les graphiques
  const epochs = poolData.history ? poolData.history.map(item => item.epoch) : [];
  const activeStake = poolData.history ? poolData.history.map(item => item.activeStake) : [];
  const delegatorsCount = poolData.history ? poolData.history.map(item => item.delegatorsCount) : [];

  const lineData = {
    labels: epochs,
    datasets: [
      {
        label: 'Active Stake',
        data: activeStake,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Delegators Count',
        data: delegatorsCount,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const barData = {
    labels: poolData.delegators ? poolData.delegators.map(d => d.address) : [],
    datasets: [
      {
        label: 'Live Stake',
        data: poolData.delegators ? poolData.delegators.map(d => d.liveStake) : [],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Pool Performance Over Time',
      },
    },
  };

  return (
    <div className="container mx-auto p-4 text-white bg-gray-800 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">{poolData.metadata?.name || "Pool Details"}</h1>
      
      <div className="mb-6">
        <h2 className="text-xl mb-2">Pool Stats</h2>
        <p>Pool ID: {poolData.metadata?.pool_id}</p>
        <p>Delegators: {poolData.stats?.delegators}</p>
        <p>Saturation: {poolData.stats?.saturationPercentage}%</p>
        <p>Margin: {poolData.stats?.marginPercentage}</p>
        <p>Fixed Cost: {poolData.stats?.fixedCost}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl mb-2">Stake and Delegators History</h2>
        <Line data={lineData} options={options} />
      </div>

      <div>
        <h2 className="text-xl mb-2">Delegators Live Stake</h2>
        <Bar data={barData} options={options} />
      </div>

      {/* Affichage JSON brut pour débogage ou information complète */}
      <pre className="bg-gray-900 text-white p-4 rounded-lg overflow-auto">
        {JSON.stringify(poolData, null, 2)}
      </pre>
    </div>
  );
}

export default PoolPage;