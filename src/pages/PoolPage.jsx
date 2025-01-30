import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig'; // Assure-toi d'avoir correctement configuré ton fichier API_CONFIG
import GetHandle from '../components/GetHandle';
import CopyButton from '../components/CopyButton';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Importation des composants pour les onglets
import DiagramTab from '../components/DiagramTab';
import JSONTab from '../components/JSONTab';
import { TokenContext } from '../utils/TokenContext';

// Enregistrement des modules de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function PoolPage() {
  const { poolId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('diagram');
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}pool/${poolId}`); // Appel à l'API pour récupérer les données de la pool
        setData(response.data);
      } catch (err) {
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [poolId]);

  // Préparer les données pour les graphiques
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

const sortedDelegators = data?.delegators.map((delegator, index) => {
  const stakeKey = delegator.address; // Assure que la variable reste bien une stakekey

  return (
    <div key={index} className="mb-4 rounded-lg bg-slate-900 p-4">
      {/* Affichage du handle sans affecter la clé 
      <GetHandle stakekey={stakeKey} />*/}
      <p className="text-lg">
        Address: <CopyButton text={stakeKey} /> {stakeKey}
      </p>
      <p className="text-sm">Live Stake: {delegator.liveStake} ₳</p>
    </div>
  );
});

  // Calcul de la couleur de la barre de progression en fonction du pourcentage de saturation
  const saturationPercentage = parseFloat(data?.stats.saturationPercentage || 0);
  const progressBarColor = saturationPercentage < 80 ? 'bg-green-500' : 'bg-orange-500';

  // Affichage de l'interface
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="container mx-auto p-6 dark:bg-base-800">
      <h1 className="text-3xl font-bold text-center text-sky-500 mb-6">{data.metadata.name}</h1>
      <div className="text-center mb-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">Ticker: <span className="font-bold text-sky-500">{data.metadata.ticker}</span></p>
        <p className="text-lg">Saturation: <span className="font-bold">{data.stats.saturationPercentage}%</span></p>
        <p className="text-lg">Fixed Cost: <span className="font-bold">{data.stats.fixedCost} ₳</span></p>
      </div>

      {/* Barre de progression pour la saturation */}
      <div className="mb-4">
        <div className="relative pt-1 max-w-lg mx-auto">
          <div className="flex mb-2 items-center justify-between">
            <span className="text-xs font-semibold inline-block py-1 px-2 mx-auto uppercase rounded-full text-teal-600 dark:text-teal-300">
              {saturationPercentage}% Saturation
            </span>
          </div>
          <div className="flex mb-2">
            <div className="w-full sm:w-2/3 mx-auto bg-gray-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${progressBarColor}`}
                style={{ width: `${saturationPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs mb-6">
        <a className={`tab tab-bordered ${activeTab === 'diagram' ? 'tab-active' : ''}`} onClick={() => setActiveTab('stats')}>Stats </a>
        <a className={`tab tab-bordered ${activeTab === 'relays' ? 'tab-active' : ''}`} onClick={() => setActiveTab('relays')}>Relays</a>
        <a className={`tab tab-bordered ${activeTab === 'delegators' ? 'tab-active' : ''}`} onClick={() => setActiveTab('delegators')}>Delegators </a>
        <a className={`tab tab-bordered ${activeTab === 'json' ? 'tab-active' : ''}`} onClick={() => setActiveTab('json')}>JSON</a>
      </div>

      {activeTab === 'diagram' && (
        <div>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold">Active Stake (₳)</h3>
            <Line key={activeTab} data={historyChartData} options={{ responsive: true }} />
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold">Rewards (₳)</h3>
            <Line key={activeTab} data={rewardsChartData} options={{ responsive: true }} />
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold">Delegators Count</h3>
            <Line key={activeTab} data={delegatorsChartData} options={{ responsive: true }} />
          </div>
        </div>
      )}

      {activeTab === 'relays' && (
        <div>
          <h2 className="text-xl font-semibold text-sky-500 mb-4">Relays</h2>
          {data.relays && data.relays.length > 0 ? (
            data.relays.map((relay, index) => (
              <div key={index} className="mb-4">
                <p className="text-lg">Relay #{relay.relay}</p>
                <p className="text-sm">IP: {relay.data.ipInfo.ip}</p>
                <p className="text-sm">Hostname: {relay.data.ipInfo.hostname}</p>
                <p className="text-sm">City: {relay.data.ipInfo.city}, {relay.data.ipInfo.country}</p>
                <p className="text-sm">Port: {relay.data.port}</p>
              </div>
            ))
          ) : (
            <p>No relays available.</p>
          )}
        </div>
      )}
      {activeTab === 'delegators' && (
        <pre className="p-4 rounded-lg overflow-auto text-left">
         {sortedDelegators}
        </pre>
      )}
      {activeTab === 'json' && (
        <pre className="p-4 rounded-lg overflow-auto text-left bg-gray-900">
         {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default PoolPage;
