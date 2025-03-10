import React from 'react';
import { shortener } from '../utils/utils';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Enregistrer les composants ChartJS nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const WalletDelegations = ({ delegationData }) => {
  // Préparer les données pour le graphique
  const chartData = {
    labels: delegationData?.delegationHistory?.map(d => `Epoch ${d.active_epoch}`) || [],
    datasets: [{
      label: 'Amount (ADA)',
      data: delegationData?.delegationHistory?.map(d => Number(d.amount) / 1000000) || [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      tension: 0.1,
      fill: false,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Delegation Amount Over Time'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Epoch'
        }
      }
    }
  };

  if (!delegationData?.delegationHistory?.length) {
    return (
      <div className="card rounded-lg p-4 text-center">
        <p className="text-gray-500">No delegation history available</p>
      </div>
    );
  }

  return (
    <div className="card rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Delegation History</h2>
      
      {/* Graphique ChartJS */}
      <div className="mb-6">
        <Line data={chartData} options={chartOptions} />
      </div>
      <p className="text-sm text-gray-500">
        Total delegations: {delegationData.totalEntries}
      </p>
      <div className="overflow-x-auto mt-4">
        <table className="w-full">
          <thead>
            <tr>
              <th>Epoch</th>
              <th>Amount (ADA)</th>
              <th>Pool ID</th>
            </tr>
          </thead>
          <tbody>
            {delegationData.delegationHistory.map((delegation, index) => (
              <tr key={index} className="hover">
                <td>{delegation.active_epoch}</td>
                <td>
                  {(Number(delegation.amount) / 1000000).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
                <td>
                  <Link 
                    to={`/pool/${delegation.pool_id}`}
                    className="text-primary hover:text-primary/50"
                    title={delegation.pool_id}
                  >
                    {shortener(delegation.pool_id, 8, 8)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default WalletDelegations;