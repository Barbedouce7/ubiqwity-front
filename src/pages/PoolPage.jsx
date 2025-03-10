import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import PoolCharts from '../components/PoolCharts';
import JSONTab from '../components/JSONTab';
import PoolDelegatorsTab from '../components/PoolDelegatorsTab';
import { TokenContext } from '../utils/TokenContext';
import { useParams, Link } from 'react-router-dom';
import { shortener } from '../utils/utils';
import { FormatNumberWithSpaces } from '../utils/FormatNumberWithSpaces';
import { GlobeAltIcon } from '@heroicons/react/24/solid';
import CopyButton from '../components/CopyButton';

function PoolPage() {
  const { poolId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // Default tab is 'details'
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
          <div key={index} className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl text-base-content">
            <p className="text-lg">
              Owner: <CopyButton text={owner} />{' '}
              <Link className="text-primary hover:text-cyan-100" to={`/wallet/${owner}`}>
                {shortener(owner)}
              </Link>
            </p>
          </div>
        ))}
        {rewardAccount && (
          <div className="mb-4 rounded-lg bg-base-100 p-4 text-base-content shadow-xl">
            <p className="text-lg">
              Reward Account: <CopyButton text={rewardAccount} />{' '}
              <Link className="text-primary hover:text-cyan-100" to={`/wallet/${rewardAccount}`}>
                {shortener(rewardAccount)}
              </Link>
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderDetailsInfo = () => (
    <div className="card rounded-lg p-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          {data.metadata.description && (
            <p className="text-lg mb-4">
              <strong>Description:</strong>{' '}
              <span className="text-sky-500">{data.metadata.description}</span>
            </p>
          )}
          <p className="text-lg">
            <strong>Pool ID:</strong> <CopyButton text={data.metadata.pool_id} />{' '}
            <span className="text-sky-500">{shortener(data.metadata.pool_id)}</span>
          </p>
          <p className="text-lg">
            <strong>Fixed Cost:</strong> <span className="text-sky-500">{data.stats.fixedCost} ₳</span>
          </p>
          <p className="text-lg">
            <strong>Margin Cost:</strong> <span className="text-sky-500">{data.stats.marginPercentage}</span>
          </p>
          <p className="text-lg">
            <strong>Live Pledge:</strong>{' '}
            <span className="text-sky-500">
              <FormatNumberWithSpaces number={data.stats.pledge.live} /> ₳
            </span>
          </p>
          <p className="text-lg">
            <strong>Declared Pledge:</strong>{' '}
            <span className="text-sky-500">
              <FormatNumberWithSpaces number={data.stats.pledge.declared} /> ₳
            </span>
          </p>
          <p className="text-lg">
            <strong>Delegators:</strong> <span className="text-sky-500">{data.stats.delegators}</span>
          </p>
        </div>
      </div>
    </div>
  );

  const renderStatsContent = () => (
    <div className="grid  gap-4">
      <div className="">
        <PoolCharts data={data} />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'details':
        return renderDetailsInfo();
      case 'stats':
        return renderStatsContent();
      case 'delegators':
        return <PoolDelegatorsTab delegators={data?.delegators || []} />;
      case 'relays':
        return (
          <div className="bg-base-400 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-primary mb-4">Relays</h2>
            {data.relays && data.relays.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.relays.map((relay, index) => (
                  <div key={index} className="mb-4 rounded-lg bg-base-100 p-4 shadow-xl">
                    <p className="text-lg">#{relay.relay}</p>
                    {relay.data.ipInfo?.ip && (
                      <p className="text-sm">
                        IP: <span className="font-bold">{relay.data.ipInfo.ip}</span>
                      </p>
                    )}
                    {relay.data.dns && (
                      <p className="text-sm">
                        DNS: <span className="font-bold">{relay.data.dns}</span>
                      </p>
                    )}
                    {relay.data.ipInfo?.hostname && (
                      <p className="text-sm">
                        Hostname: <span className="font-bold">{relay.data.ipInfo.hostname}</span>
                      </p>
                    )}
                    {(relay.data.ipInfo?.city || relay.data.ipInfo?.country) && (
                      <p className="text-sm">
                        City:
                        {relay.data.ipInfo.city && (
                          <span className="font-bold"> {relay.data.ipInfo.city}</span>
                        )}
                        {relay.data.ipInfo.city && relay.data.ipInfo.country && ','}
                        {relay.data.ipInfo.country && (
                          <span className="font-bold"> {relay.data.ipInfo.country}</span>
                        )}
                      </p>
                    )}
                    {relay.data.port && (
                      <p className="text-sm">
                        Port: <span className="font-bold">{relay.data.port}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base-content">No relays available from on-chain data.</p>
            )}
          </div>
        );
      case 'owner':
        return renderOwnersAndReward();
      case 'json':
        return (
          <pre className="p-4 rounded-lg overflow-auto text-left bg-base-100 text-base-content shadow-xl">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40 mb-40" />
    );
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 text-base-content">
      <div className="mb-8">
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-3xl font-bold text-center text-sky-500 mb-2">{data.metadata.name}</h1>
          <div className="flex items-center">
            <p className="text-lg">
              Ticker: <span className="font-bold text-sky-500">{data.metadata.ticker}</span>
              {data.metadata.homepage && (
                <span className="ml-2">
                  <a href={data.metadata.homepage} className="inline-flex items-center">
                    <GlobeAltIcon className="w-4 h-4 text-sky-500" />
                  </a>
                </span>
              )}
            </p>
          </div>
          <div className="mt-4 w-full max-w-lg">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <span className="text-xs font-semibold inline-block py-1 px-2 mx-auto uppercase rounded-full text-teal-600 dark:text-teal-300">
                  {saturationPercentage}% Saturation
                </span>
              </div>
              <div className="flex mb-2">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${progressBarColor}`}
                    style={{ width: `${saturationPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs mt-4 mb-6 flex flex-wrap justify-center items-center">
        {['details', 'stats', 'delegators', 'relays', 'owner', 'json'].map((tab) => (
          <a
            key={tab}
            className={`tab-custom ${activeTab === tab ? 'tab-custom-active' : ''} cursor-pointer`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </a>
        ))}
      </div>

      {renderContent()}
    </div>
  );
}

export default PoolPage;