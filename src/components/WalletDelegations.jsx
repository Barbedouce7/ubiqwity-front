import React, { useEffect, useState, useCallback } from 'react';
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
  const [theme, setTheme] = useState('light');

  // Détection du thème dynamique
  const detectTheme = useCallback(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      if (document.documentElement.classList.contains("dark") || 
          document.documentElement.classList.contains("vibrant")) {
        return "dark";
      }
    }
    return "light";
  }, []);

  // Mettre à jour le thème dynamiquement
  useEffect(() => {
    const updateTheme = () => setTheme(detectTheme());
    updateTheme(); // Initialisation

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, [detectTheme]);

  // Couleurs adaptées au thème
  const colors = {
    amount: {
      light: { borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.5)' },
      dark: { borderColor: 'rgb(100, 170, 255)', backgroundColor: 'rgba(100, 170, 255, 0.5)' },
    },
  };

  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Préparer les données pour le graphique
  const chartData = {
    labels: delegationData?.delegationHistory?.map(d => `Epoch ${d.active_epoch}`) || [],
    datasets: [{
      label: 'Amount (ADA)',
      data: delegationData?.delegationHistory?.map(d => Number(d.amount) / 1000000) || [],
      borderColor: colors.amount[theme].borderColor,
      backgroundColor: colors.amount[theme].backgroundColor,
      tension: 0.1,
      fill: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor },
      },
      title: {
        display: true,
        text: 'Delegation Amount Over Time',
        color: textColor,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: textColor,
        bodyColor: textColor,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Epoch',
          color: textColor,
        },
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
      y: {
        title: {
          display: true,
          text: 'Amount (ADA)',
          color: textColor,
        },
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
    },
  };

  if (!delegationData?.delegationHistory?.length) {
    return (
      <div className="card rounded-lg p-4 text-center">
        <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
          No delegation history available
        </p>
      </div>
    );
  }

  return (
    <div className="card rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4" style={{ color: textColor }}>
        Delegation History
      </h2>
      
      {/* Graphique ChartJS */}
      <div className="mb-6">
        <Line data={chartData} options={chartOptions} />
      </div>
      <p style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} className="text-sm">
        Total delegations: {delegationData.totalEntries}
      </p>
      <div className="overflow-x-auto mt-4">
        <table className="w-full">
          <thead>
            <tr style={{ color: textColor }}>
              <th>Epoch</th>
              <th>Amount (ADA)</th>
              <th>Pool ID</th>
            </tr>
          </thead>
          <tbody>
            {delegationData.delegationHistory.map((delegation, index) => (
              <tr key={index} className="hover" style={{ color: textColor }}>
                <td>{delegation.active_epoch}</td>
                <td>
                  {(Number(delegation.amount) / 1000000).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td>
                  <Link
                    to={`/pool/${delegation.pool_id}`}
                    className={`hover:text-opacity-50 ${
                      theme === 'dark' ? 'text-blue-400' : 'text-primary'
                    }`}
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