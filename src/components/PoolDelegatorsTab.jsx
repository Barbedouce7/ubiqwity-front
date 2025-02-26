import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { useTheme } from '../utils/useTheme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const generateRandomColor = (themeColors) => {
  const hue = Math.floor(Math.random() * 360);
  return themeColors.theme === 'dark' 
    ? `hsla(${hue}, 70%, 60%, 0.7)` 
    : `hsla(${hue}, 70%, 40%, 0.7)`;
};

const generateDelegatorColors = (delegators, colors) => {
  return delegators.reduce((acc, delegator) => {
    acc[delegator.address] = generateRandomColor(colors);
    return acc;
  }, {});
};

const PoolDelegatorsTab = ({ delegators }) => {
  const { colors } = useTheme();
  const [sortedDelegators, setSortedDelegators] = useState([]);
  const [totalStake, setTotalStake] = useState(0);
  const [delegatorColors, setDelegatorColors] = useState({});
  const chartRef = useRef(null);
  const navigate = useNavigate();
  const [lastTap, setLastTap] = useState(0);

  // Initialisation des données et couleurs quand les délégateurs changent
  useEffect(() => {
    if (delegators && delegators.length > 0) {
      const sorted = [...delegators].sort((a, b) => b.liveStake - a.liveStake);
      const total = sorted.reduce((sum, d) => sum + d.liveStake, 0);
      
      setSortedDelegators(sorted);
      setTotalStake(total);
      setDelegatorColors(generateDelegatorColors(sorted, colors)); // Généré une seule fois ici
    }
  }, [delegators]); // Retiré "colors" des dépendances

  const maxStake = sortedDelegators[0]?.liveStake || 1;

  const bubbleData = sortedDelegators.map((delegator, index) => ({
    x: index,
    y: delegator.liveStake,
    r: (delegator.liveStake / maxStake) * 20 + 5,
    liveStake: delegator.liveStake,
    address: delegator.address
  }));

  const handlePointClick = (event, elements) => {
    if (elements.length > 0) {
      const idx = elements[0].index;
      const address = bubbleData[idx].address;
      navigate(`/wallet/${address}`);
    }
  };

  const handleTouch = (event) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 300 && tapLength > 0) {
      const elements = chartRef.current.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: true },
        false
      );
      handlePointClick(event, elements);
      event.preventDefault();
    }
    setLastTap(currentTime);
  };

  const chartData = {
    datasets: [{
      data: bubbleData,
      backgroundColor: sortedDelegators.map(delegator => delegatorColors[delegator.address]),
      borderColor: colors.primary,
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
          text: 'Live Stake (₳)',
          color: colors.text
        },
        ticks: {
          color: colors.text
        }
      },
      x: {
        title: {
          display: true,
          text: 'Delegators',
          color: colors.text
        },
        ticks: {
          callback: function(value) {
            if (bubbleData[value]) {
              return shortener(bubbleData[value].address);
            }
            return '';
          },
          color: colors.text
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        callbacks: {
          title: () => '',
          label: (context) => {
            const dataPoint = bubbleData[context.dataIndex];
            if (!dataPoint) return '';
            return [
              `Wallet: ${shortener(dataPoint.address)}`,
              `Stake: ${dataPoint.liveStake} ₳`,
              'Click to view details'
            ];
          }
        }
      }
    },
    maintainAspectRatio: false,
    onClick: handlePointClick,
  };

  const refreshColors = () => {
    setDelegatorColors(generateDelegatorColors(sortedDelegators, colors));
  };

  return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
          Delegators Live Stake Distribution ( {sortedDelegators.length} firsts )
        </h2>
      </div>

      <div className="w-full h-96 card bg-base-100">
        <div 
          className="card-body p-4"
          onTouchStart={handleTouch}
        >
          <Bubble 
            ref={chartRef}
            data={chartData} 
            options={chartOptions}
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={refreshColors}
          className="btn btn-primary gap-2"
          style={{ backgroundColor: colors.primary, color: colors.text }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Random color
        </button>
      </div>

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
                <div className="flex-1 text-center">
                  <GetHandle stakekey={stakeKey} />
                </div>
                <p className="text-sm font-semibold" style={{ color: colors.text }}>
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