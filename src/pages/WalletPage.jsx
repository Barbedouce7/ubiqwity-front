import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import GetHandle from '../components/GetHandle';


function WalletPage() {
  const { walletAddress } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('addresses');
  const [adaBalance, setAdaBalance] = useState("0");
  const [detailsData, setDetailsData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Reset all states when wallet address changes
  useEffect(() => {
    setData(null);
    setLoading(true);
    setError(null);
    setActiveTab('addresses');
    setAdaBalance("0");
    setDetailsData(null);
    setLoadingDetails(false);
  }, [walletAddress]);

  const formatQuantity = useCallback((quantity, decimals) => {
    if (!quantity) return "0";
    return decimals ? 
      (Number(quantity) / Math.pow(10, decimals)).toFixed(decimals) : 
      quantity.toString();
  }, []);

  const transactions = useMemo(() => {
    if (!detailsData?.full_dataset) return null;
    
    return detailsData.full_dataset.map(tx => ({
      hash: tx.txHash,
      timestamp: tx.timestamp,
      // On peut ajouter d'autres informations si nécessaire
    }));
  }, [detailsData]);

    const isTransactionLimitExceeded = useMemo(() => {
    return data?.stakekeyInfo?.totalTransactions > 5000;
  }, [data?.stakekeyInfo?.totalTransactions]);


    const availableTabs = useMemo(() => {
      const baseTabs = ['hold', 'addresses'];
      const allTabs = !isTransactionLimitExceeded 
        ? [...baseTabs, 'historic', 'activity', 'friends', 'transactions'] 
        : baseTabs;
      return [...allTabs, 'json'];
    }, [isTransactionLimitExceeded]);


  const getTabAvailability = useCallback(() => {
    const baseAvailability = {
      hold: Boolean(data?.holdings),
      addresses: Boolean(data?.stakekeyInfo?.addressList),
      json: Boolean(data)
    };

    if (!isTransactionLimitExceeded) {
      return {
        ...baseAvailability,
        historic: Boolean(detailsData?.full_dataset),
        activity: Boolean(detailsData),
        friends: Boolean(detailsData),
        transactions: Boolean(transactions)
      };
    }
    return baseAvailability;
  }, [data, detailsData, transactions, isTransactionLimitExceeded]);


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
  if (
    (activeTab === "friends" ||
      activeTab === "activity" ||
      activeTab === "historic" ||
      activeTab === "transactions") &&
    (data?.stakekeyInfo?.stakekey || data?.stakekeyInfo?.addressList?.[0]) &&
    !detailsData &&
    !isTransactionLimitExceeded
  ) {
    const fetchDetailsData = async () => {
      setLoadingDetails(true);
      try {
        // On utilise stakekey si disponible, sinon on prend la première adresse
        const identifier = data.stakekeyInfo.stakekey || data.stakekeyInfo.addressList[0];
        const response = await axios.get(`${API_CONFIG.baseUrl}wallet/${identifier}/details`);
        setDetailsData(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des détails :", error);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetailsData();
  }
}, [activeTab, data, detailsData, isTransactionLimitExceeded]);




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
    const [integerPart, decimalPart] = adaBalance.toString().split(".");
  const tabAvailability = getTabAvailability();

 const getTabStyle = (tabName) => {
    const baseStyle = "tab-custom cursor-pointer";
    const activeStyle = "tab-custom-active";
    const unavailableStyle = "opacity-60";
    
    if (activeTab === tabName) {
      return `${baseStyle} ${activeStyle}`;
    }
    return `${baseStyle} ${!getTabAvailability()[tabName] ? unavailableStyle : ''}`;
  };

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">Wallet Details</h1>
      <div className="mb-4">
        <div className="">
          <strong>{stakekeyInfo.stakekey ? "Stake Address:" : "Address:"}</strong> 
          <CopyButton text={stakekeyInfo.stakekey || stakekeyInfo.addressList?.[0]} /> 
          {shortener(stakekeyInfo.stakekey || stakekeyInfo.addressList?.[0])}
        </div>

        {!stakekeyInfo.stakekey && (
          <div className=" text-sm text-gray-500">
            Single address (no stakekey)
          </div>
        )}

        <div className="mb-4">
          <GetHandle stakekey={stakekeyInfo.stakekey || stakekeyInfo.addressList?.[0]} />
        </div>

         <h2 className="text-xl font-bold mb-4 text-center">
                   <img 
            src="/assets/cardano.webp" 
            alt="ADA" 
            className="iconCurrency inline-block mr-2 rounded-full w-6 h-6"
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
      {integerPart}
      {decimalPart && (
        <span className="text-sm text-gray-400 opacity-70">
          .{decimalPart}
        </span>
      )}
      {' '}ADA{' '}
 
        </h2>

<div className="mb-2 flex gap-4 justify-center items-center">
    <p>
      {!stakekeyInfo.stakekey ? null : (
        <>
          <strong>Address{stakekeyInfo.numberOfAddresses > 1 ? "es" : ""}:</strong> {stakekeyInfo.numberOfAddresses} |  
        </>
      )}
      <strong> Transaction{stakekeyInfo.totalTransactions > 1 ? "s" : ""}:</strong> {stakekeyInfo.totalTransactions}
    </p>
</div>
  {stakekeyInfo.totalTransactions > 5000 && (
    <div className="justify-center flex items-center space-x-2 text-xs text-red-500 mb-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>
      <span>Too many transactions: <br />limited user experience</span>
    </div>

  )}



        <div className="mb-2">
          {stakekeyInfo.stakepool ? (
            <>
              <strong>Pool:</strong> 
              <Link className="text-sky-500 ml-1" to={`/pool/${stakekeyInfo.stakepool.pool_id}`}>
                {stakekeyInfo.stakepool.ticker || 'Unknown Ticker'}
              </Link>
            </>
          ) : (
            <p></p>
          )}
        </div>
      </div>

      
      <div className="tabs mt-6 mb-6 flex justify-center items-center">
        <div className="tabs">
          {availableTabs.map(tab => (
            <a 
              key={tab}
              className={getTabStyle(tab)} 
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </a>
          ))}
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
          {loadingDetails ? (
            <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>
          ) : transactions ? (
            <TransactionsTab transactions={transactions} />
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