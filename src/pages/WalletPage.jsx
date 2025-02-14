import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import CopyButton from '../components/CopyButton';
import WalletHold from '../components/WalletHold';
import WalletFriends from '../components/WalletFriends';
import ActivityCharts from '../components/ActivityCharts';
import HistoricCharts from '../components/HistoricCharts';
import TransactionsTab from '../components/TransactionsTab';
import { shortener } from '../utils/utils';

function WalletPage() {
  const { walletAddress } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('addresses');
  const [adaBalance, setAdaBalance] = useState("0");
  const [detailsData, setDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [txsData, setTxsData] = useState(null);
  const [loadingTxs, setLoadingTxs] = useState(false);

  const formatQuantity = useCallback((quantity, decimals) => {
    if (!quantity) return "0";
    return decimals ? 
      (Number(quantity) / Math.pow(10, decimals)).toFixed(decimals) : 
      quantity.toString();
  }, []);

  useEffect(() => {
    if (data?.holdings) {
      const adaHolding = data.holdings.find(h => h.unit === "lovelace");
      if (adaHolding) {
        setAdaBalance(formatQuantity(adaHolding.quantity, 6));
      }
    }
  }, [data, formatQuantity]);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) {
        setError('Stake key or address is missing or undefined.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}wallet/${walletAddress}`);
        setData(response.data);
      } catch (error) {
        if (error.response && error.response.status === 400) {
          setError(error.response.data.message || 'Bad request. Please try again.');
        } else {
          console.error('Error fetching wallet data:', error);
          setError('An error occurred while fetching wallet data');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [walletAddress]);

  useEffect(() => {
    if ((activeTab === "friends" || activeTab === "activity" || activeTab === "historic") && data?.stakekeyInfo?.stakekey && !detailsData) {
      const fetchDetailsData = async () => {
        setLoadingDetails(true);
        try {
          const response = await axios.get(`${API_CONFIG.baseUrl}wallet/${data.stakekeyInfo.stakekey}/details`);
          setDetailsData(response.data);
        } catch (error) {
          console.error("Error fetching details data:", error);
        } finally {
          setLoadingDetails(false);
        }
      };
      fetchDetailsData();
    }
  }, [activeTab, data?.stakekeyInfo?.stakekey, detailsData]);

  useEffect(() => {
    if (activeTab === "transactions" && data?.stakekeyInfo?.stakekey && !txsData) {
      const fetchTxsData = async () => {
        setLoadingTxs(true);
        try {
          const response = await axios.get(`${API_CONFIG.baseUrl}wallet/${data.stakekeyInfo.stakekey}/transactions`);
          setTxsData(response.data);
        } catch (error) {
          console.error("Error fetching transactions data:", error);
        } finally {
          setLoadingTxs(false);
        }
      };
      fetchTxsData();
    }
  }, [activeTab, data?.stakekeyInfo?.stakekey, txsData]);

  if (loading) {
    return <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  }

  if (!data || !data.stakekeyInfo) {
    return <div>No wallet data available</div>;
  }

  const { stakekeyInfo, holdings } = data;

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">Wallet Details</h1>
      <div className="mb-4">
        <div className="mb-2">
          <strong>Stake Address:</strong> 
          <CopyButton text={stakekeyInfo.stakekey} /> 
          {shortener(stakekeyInfo.stakekey)}
        </div>
        
        <h2 className="text-xl font-bold mb-4 text-center">
          {adaBalance}{' '}ADA{' '}
          <img 
            src="/assets/cardano.webp" 
            alt="ADA" 
            className="iconCurrency inline-block ml-2 rounded-full w-6 h-6"
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </h2>

        <div className="mb-2 flex gap-4 justify-center">
          <p>
            <strong>Addresses:</strong> {stakekeyInfo.numberOfAddresses} | <strong>Transactions:</strong> {stakekeyInfo.totalTransactions}
          </p>
        </div>

        <div className="mb-2">
          {stakekeyInfo.stakepool ? (
            <>
              <strong>Pool:</strong> 
              <Link className="text-sky-500 ml-1" to={`/pool/${stakekeyInfo.stakepool.pool_id}`}>
                {stakekeyInfo.stakepool.ticker || 'Unknown Ticker'}
              </Link>
            </>
          ) : (
            <p>No stake pool</p>
          )}
        </div>
      </div>

      <div className="tabs mt-6 mb-6 flex justify-center items-center">
        <div className="tabs">
          <a className={`tab-custom ${activeTab === 'hold' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('hold')}>Hold</a>
          <a className={`tab-custom ${activeTab === 'addresses' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('addresses')}>Addresses</a>
          <a className={`tab-custom ${activeTab === 'historic' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('historic')}>Historic</a>
          <a className={`tab-custom ${activeTab === 'activity' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('activity')}>Activity</a>
          <a className={`tab-custom ${activeTab === 'friends' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('friends')}>Friends</a>
          <a className={`tab-custom ${activeTab === 'transactions' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('transactions')}>Transactions</a>
          <a className={`tab-custom ${activeTab === 'json' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('json')}>JSON</a>
        </div>
      </div>

      {activeTab === 'addresses' && (
        <div>
          <h2 className="text-lg font-bold mb-4 text-center">Addresses ({stakekeyInfo.numberOfAddresses})</h2>
          {stakekeyInfo.addressList.map((address, index) => (
            <div key={index} className="mb-4 card text-base-content bg-base-100 text-white shadow-2xl rounded-lg overflow-hidden">
              <div className="card-body p-4">
                <div>
                  <strong>Address: </strong>
                  <Link className="text-primary hover:text-cyan-100" to={`/address/${address}`}>
                    {shortener(address)}
                  </Link>
                  <CopyButton text={address} className="ml-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          {loadingDetails ? (
            <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>
          ) : (
            <ActivityCharts stakekey={stakekeyInfo.stakekey} detailsData={detailsData} />
          )}
        </div>
      )}
      {activeTab === 'historic' && (
        <div>
          {loadingDetails ? (
            <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>
          ) : (
            <HistoricCharts data={detailsData?.full_dataset} />
          )}
        </div>
      )}

      {activeTab === 'hold' && (
        <WalletHold holdingsData={{ holdings, stakekey: stakekeyInfo.stakekey }} />
      )}

      {activeTab === 'friends' && (
        <div>
          {loadingDetails ? (
            <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>
          ) : (
            <WalletFriends stakekey={stakekeyInfo.stakekey} friendsData={detailsData} />
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div>
          {loadingTxs ? (
            <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>
          ) : txsData ? (
            <TransactionsTab transactions={txsData.transactions} />
          ) : (
            <div className="text-center mt-10 text-red-500">No transactions data available</div>
          )}
        </div>
      )}

      {activeTab === 'json' && (
        <div className="shadow-xl">
          <h2 className="text-lg font-bold mb-2">JSON Data</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default WalletPage;