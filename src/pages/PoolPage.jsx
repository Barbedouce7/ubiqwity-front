import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import PoolCharts from '../components/PoolCharts';
import DiagramTab from '../components/DiagramTab';
import JSONTab from '../components/JSONTab';
import PoolDelegatorsTab from '../components/PoolDelegatorsTab'; 
import { TokenContext } from '../utils/TokenContext';
import { useParams, Link } from 'react-router-dom';
import CopyButton from '../components/CopyButton';
import { shortener } from '../utils/utils';
import { FormatNumberWithSpaces } from '../utils/FormatNumberWithSpaces';
import { GlobeAltIcon } from '@heroicons/react/24/solid';


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

  const renderOwnersAndReward = () => {
    const owners = data?.owners || [];
    const rewardAccount = data?.rewardAccount;

    return (
      <div className="p-4 rounded-lg overflow-auto">
        {owners.map((owner, index) => (
          <div key={index} className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl  text-base-content">
            <p className="text-lg">
              Owner : <CopyButton text={owner} /> <Link className="text-primary hover:text-cyan-100" to={`/wallet/${owner}`}>{shortener(owner)}</Link>
            </p>
          </div>
        ))}
        {rewardAccount && (
          <div className="mb-4 rounded-lg bg-base-100 p-4  text-base-content shadow-xl">
            <p className="text-lg">
              Reward Account : <CopyButton text={rewardAccount} /><Link className="text-primary hover:text-cyan-100" to={`/wallet/${rewardAccount}`}> {shortener(rewardAccount)}</Link>
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="animate-spin rounded-full  mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40 mb-40"></div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto p-6 p-4  text-base-content">
      <h1 className="text-3xl font-bold text-center text-sky-500 mb-6">{data.metadata.name}</h1>


      <div className="text-center mb-6 mt-6">
        <p className="text-lg text-gray-700 dark:text-gray-300">Ticker: <span className="font-bold text-sky-500">{data.metadata.ticker}</span>
{data.metadata.homepage && (<span className="font-bold text-sky-500 ml-2 mt-2"><a href={data.metadata.homepage} className="inline-flex items-center"><GlobeAltIcon className="w-4 h-4" /></a></span>)}
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-300">Pool id: <CopyButton text={data.metadata.pool_id} /><span className="font-bold text-sky-500">{shortener(data.metadata.pool_id)}</span></p>
        <p className="text-lg">Fixed Cost: <span className="font-bold">{data.stats.fixedCost} ₳</span></p>
        <p className="text-lg">Margin Cost: <span className="font-bold">{data.stats.marginPercentage}</span></p>
        <p className="text-lg">Live Pledge: <span className="font-bold"><FormatNumberWithSpaces number={data.stats.pledge.live}/> ₳</span></p>
        <p className="text-lg">Pledge: <span className="font-bold"><FormatNumberWithSpaces number={data.stats.pledge.declared}/> ₳</span></p>
        <p className="text-lg">Delegators: <span className="font-bold">{data.stats.delegators}</span></p>
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
 

<div className="tabs mt-6 mb-6 flex justify-center items-center relative">
  <div className="tabs">
    <a className={`tab-custom ${activeTab === 'diagram' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('diagram')}>Stats</a>
    <a className={`tab-custom ${activeTab === 'description' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('description')}>Description</a>
    <a className={`tab-custom ${activeTab === 'delegators' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('delegators')}>Delegators</a>
    <a className={`tab-custom ${activeTab === 'relays' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('relays')}>Relays</a>
    <a className={`tab-custom ${activeTab === 'owner' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('owner')}>Owner</a>
    <a className={`tab-custom ${activeTab === 'json' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('json')}>JSON</a>
  </div>
</div>

{activeTab === 'diagram' && <PoolCharts data={data} />}
{activeTab === 'description' &&      <p className="text-lg max-w-lg mx-auto text-gray-700 dark:text-gray-300 mt-6"><span className="font-bold text-sky-500">{data.metadata.description}</span></p> }
{activeTab === 'relays' && (
  <div className="bg-base-400 rounded-lg p-4">
    <h2 className="text-xl font-semibold text-primary mb-4">Relays</h2>
    {data.relays && data.relays.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.relays.map((relay, index) => (
          <div key={index} className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
            <p className="text-lg">#{relay.relay}</p>
            <p className="text-sm">IP: <span className="font-bold">{relay.data.ipInfo.ip}</span></p>
            <p className="text-sm">Hostname: <span className="font-bold">{relay.data.ipInfo.hostname}</span></p>
            <p className="text-sm">City: <span className="font-bold">{relay.data.ipInfo.city}</span>, <span className="font-bold">{relay.data.ipInfo.country}</span></p>
            <p className="text-sm">Port: <span className="font-bold">{relay.data.port}</span></p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-base-content">No relays available from on-chain data.</p>
    )}
  </div>
)}
{activeTab === 'delegators' && <PoolDelegatorsTab delegators={data?.delegators || []} />}
{activeTab === 'owner' && renderOwnersAndReward()}
{activeTab === 'json' && (
  <pre className="p-4 rounded-lg overflow-auto text-left bg-base-100 text-base-content shadow-xl">
    {JSON.stringify(data, null, 2)}
  </pre>
)}
    </div>
  );
}

export default PoolPage;