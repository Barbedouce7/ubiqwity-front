import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const PoolCharts = ({ data }) => {
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
    activeStake: {
      light: { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)' },
      dark: { borderColor: 'rgb(100, 255, 255)', backgroundColor: 'rgba(100, 255, 255, 0.2)' },
    },
    rewards: {
      light: { borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)' },
      dark: { borderColor: 'rgb(255, 150, 180)', backgroundColor: 'rgba(255, 150, 180, 0.2)' },
    },
    delegators: {
      light: { borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.2)' },
      dark: { borderColor: 'rgb(80, 200, 255)', backgroundColor: 'rgba(80, 200, 255, 0.2)' },
    },
    fees: {
      light: { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.2)' },
      dark: { borderColor: 'rgb(255, 200, 100)', backgroundColor: 'rgba(255, 200, 100, 0.2)' },
    },
  };

  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const historyChartData = {
    labels: data?.history.map(item => `Epoch ${item.epoch}`) || [],
    datasets: [
      {
        label: 'Active Stake (₳)',
        data: data?.history.map(item => item.activeStake) || [],
        borderColor: colors.activeStake[theme].borderColor,
        backgroundColor: colors.activeStake[theme].backgroundColor,
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
        borderColor: colors.rewards[theme].borderColor,
        backgroundColor: colors.rewards[theme].backgroundColor,
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
        borderColor: colors.delegators[theme].borderColor,
        backgroundColor: colors.delegators[theme].backgroundColor,
        fill: true,
      },
    ],
  };

  const feesChartData = {
    labels: data?.history.map(item => `Epoch ${item.epoch}`) || [],
    datasets: [
      {
        label: 'Fees (₳)',
        data: data?.history.map(item => item.fees) || [],
        borderColor: colors.fees[theme].borderColor,
        backgroundColor: colors.fees[theme].backgroundColor,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: { color: textColor },
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
      y: { 
        title: { display: true, text: 'Value', color: textColor },
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
      x: {
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
      <div className="h-96">
        <h3 className="text-xl font-semibold mb-2 text-center" style={{ color: textColor }}>
          Active Stake (₳)
        </h3>
        <div className="h-full">
          <Line data={historyChartData} options={chartOptions} />
        </div>
      </div>

      <div className="h-96">
        <h3 className="text-xl font-semibold mb-2 text-center" style={{ color: textColor }}>
          Delegators Count
        </h3>
        <div className="h-full">
          <Line data={delegatorsChartData} options={chartOptions} />
        </div>
      </div>

      <div className="h-96">
        <h3 className="text-xl font-semibold mb-2 text-center" style={{ color: textColor }}>
          Rewards (₳)
        </h3>
        <div className="h-full">
          <Line data={rewardsChartData} options={chartOptions} />
        </div>
      </div>

      <div className="h-96">
        <h3 className="text-xl font-semibold mb-2 text-center" style={{ color: textColor }}>
          Fees (₳)
        </h3>
        <div className="h-full">
          <Line data={feesChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default PoolCharts;