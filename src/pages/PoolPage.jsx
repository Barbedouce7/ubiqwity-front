import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import GetHandle from '../components/GetHandle';
import CopyButton from '../components/CopyButton';
import { useParams } from 'react-router-dom';
import PoolCharts from '../components/PoolCharts';
import DiagramTab from '../components/DiagramTab';
import JSONTab from '../components/JSONTab';
import { TokenContext } from '../utils/TokenContext';

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
        const response = await axios.get(`${API_CONFIG.baseUrl}pool/${poolId}`);
        setData(response.data);
      } catch (err) {
        setError('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [poolId]);

  const saturationPercentage = parseFloat(data?.stats.saturationPercentage || 0);
  const progressBarColor = saturationPercentage < 80 ? 'bg-green-500' : 'bg-orange-500';

  const sortedDelegators = data?.delegators.map((delegator, index) => {
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
  });

  // New function to render owners and reward account
  const renderOwnersAndReward = () => {
    const owners = data?.owners || [];
    const rewardAccount = data?.rewardAccount;

    return (
      <div className="p-4 rounded-lg overflow-auto text-left">
        {owners.map((owner, index) => (
          <div key={index} className="mb-4 rounded-lg bg-slate-900 p-4">
            <p className="text-lg">
              Owner: <CopyButton text={owner} /> {owner}
            </p>
          </div>
        ))}
        {rewardAccount && (
          <div className="mb-4 rounded-lg bg-slate-900 p-4">
            <p className="text-lg">
              Reward Account: <CopyButton text={rewardAccount} /> {rewardAccount}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto p-6 dark:bg-base-800">
      <h1 className="text-3xl font-bold text-center text-sky-500 mb-6">{data.metadata.name}</h1>
      <p className="text-lg max-w-lg mx-auto text-gray-700 dark:text-gray-300"><span className="font-bold text-sky-500">{data.metadata.description}</span></p>

      <div className="text-center mb-6 mt-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">Ticker: <span className="font-bold text-sky-500">{data.metadata.ticker}</span></p>
        <p className="text-lg">Saturation: <span className="font-bold">{data.stats.saturationPercentage}%</span></p>
        <p className="text-lg">Fixed Cost: <span className="font-bold">{data.stats.fixedCost} ₳</span></p>
      </div>

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

      <div className="tabs mb-6">
        <a className={`tab tab-bordered ${activeTab === 'diagram' ? 'tab-active' : ''}`} onClick={() => setActiveTab('diagram')}>Stats</a>
        <a className={`tab tab-bordered ${activeTab === 'relays' ? 'tab-active' : ''}`} onClick={() => setActiveTab('relays')}>Relays</a>
        <a className={`tab tab-bordered ${activeTab === 'delegators' ? 'tab-active' : ''}`} onClick={() => setActiveTab('delegators')}>Delegators</a>
        <a className={`tab tab-bordered ${activeTab === 'owner' ? 'tab-active' : ''}`} onClick={() => setActiveTab('owner')}>Owner</a>
        <a className={`tab tab-bordered ${activeTab === 'json' ? 'tab-active' : ''}`} onClick={() => setActiveTab('json')}>JSON</a>
      </div>

      {activeTab === 'diagram' && <PoolCharts data={data} />}
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
          50 top delegators :
          {sortedDelegators}
        </pre>
      )}
      {activeTab === 'owner' && renderOwnersAndReward()}
      {activeTab === 'json' && (
        <pre className="p-4 rounded-lg overflow-auto text-left bg-gray-900">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default PoolPage;