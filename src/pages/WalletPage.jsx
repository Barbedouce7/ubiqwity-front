import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import CopyButton from '../components/CopyButton';
import WalletHold from '../components/WalletHold';
import WalletFriends from '../components/WalletFriends';
import ActivityCharts from '../components/ActivityCharts';
import HistoricCharts from '../components/HistoricCharts';
import TransactionsTab from '../components/TransactionsTab';
import LoadingProgress from '../components/LoadingProgress';
import { shortener } from '../utils/utils';
import GetHandle from '../components/GetHandle';

function WalletPage() {
  const { walletAddress } = useParams();
  const [walletData, setWalletData] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [activeTab, setActiveTab] = useState('addresses');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadedTransactions, setLoadedTransactions] = useState(0);
  const [error, setError] = useState(null);

  // Constants for configuration
  const TRANSACTION_LIMIT = 5000;
  const detailsTabs = ['historic', 'activity', 'friends', 'transactions'];

  // Computed states using useMemo
  const hasNativeTokens = useMemo(() => {
    if (!walletData?.holdings) return false;
    const nonLovelaceTokens = walletData.holdings.filter(
      h => h.unit !== "lovelace" && Number(h.quantity) > 0
    );
    return nonLovelaceTokens.length > 0;
  }, [walletData?.holdings]);

  const isTransactionLimitExceeded = useMemo(() => {
    return walletData?.stakekeyInfo?.totalTransactions > TRANSACTION_LIMIT;
  }, [walletData?.stakekeyInfo?.totalTransactions]);

  const availableTabs = useMemo(() => {
    const baseTabs = ['addresses'];
    if (hasNativeTokens) {
      baseTabs.push('hold');
    }
    if (!isTransactionLimitExceeded) {
      baseTabs.push(...detailsTabs);
    }
    baseTabs.push('json');
    return baseTabs;
  }, [isTransactionLimitExceeded, hasNativeTokens]);

  const sortedHoldings = useMemo(() => {
    if (!walletData?.holdings) return [];
    
    return [...walletData.holdings].sort((a, b) => {
      // Always keep lovelace first
      if (a.unit === "lovelace") return -1;
      if (b.unit === "lovelace") return 1;
      
      const aHasName = Boolean(a.name || a.ticker);
      const bHasName = Boolean(b.name || b.ticker);
      
      // Prioritize tokens with names/tickers
      if (aHasName && !bHasName) return -1;
      if (!bHasName && aHasName) return 1;
      
      // Sort named tokens alphabetically
      if (aHasName && bHasName) {
        return (a.name || a.ticker).localeCompare(b.name || b.ticker);
      }
      
      // Sort unnamed tokens by policy ID
      return a.unit.localeCompare(b.unit);
    });
  }, [walletData?.holdings]);

  const formattedBalance = useMemo(() => {
    const adaHolding = walletData?.holdings?.find(h => h.unit === "lovelace");
    if (!adaHolding?.quantity) return { integer: "0", decimal: "" };
    
    const balance = (Number(adaHolding.quantity) / 1000000).toFixed(6);
    const [integer, decimal] = balance.split('.');
    return { integer, decimal };
  }, [walletData?.holdings]);

  // Effect for fetching wallet data
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!walletAddress) {
        setError('Wallet address is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}wallet/${walletAddress}`);
        setWalletData(response.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch wallet data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
    
    // Cleanup
    return () => {
      setWalletData(null);
      setDetailsData(null);
      setActiveTab('addresses');
      setLoadedTransactions(0);
      setError(null);
    };
  }, [walletAddress]);

  // Effect for fetching details data
  useEffect(() => {
    const shouldFetchDetails = 
      detailsTabs.includes(activeTab) && 
      walletData?.stakekeyInfo && 
      !detailsData && 
      !isTransactionLimitExceeded;

    if (!shouldFetchDetails) return;

    const fetchDetailsData = async () => {
      setIsLoadingDetails(true);
      setLoadedTransactions(0);
      
      try {
        const identifier = walletData.stakekeyInfo.stakekey || walletData.stakekeyInfo.addressList[0];
        const response = await axios.get(`${API_CONFIG.baseUrl}wallet/${identifier}/details`);
        
        // Progressive loading simulation
        const totalTx = walletData.stakekeyInfo.totalTransactions;
        let count = 0;
        const increment = Math.max(1, Math.floor(totalTx / 20));
        
        const interval = setInterval(() => {
          count = Math.min(count + increment, totalTx);
          setLoadedTransactions(count);
          
          if (count >= totalTx) {
            clearInterval(interval);
            setDetailsData(response.data);
            setIsLoadingDetails(false);
          }
        }, 100);
        
      } catch (error) {
        console.error("Failed to fetch details:", error);
        setIsLoadingDetails(false);
      }
    };

    fetchDetailsData();
  }, [activeTab, walletData, detailsData, isTransactionLimitExceeded]);

  if (isLoading) {
    return <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40" />;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  }

  if (!walletData?.stakekeyInfo) {
    return <div className="text-center mt-10">No wallet data available</div>;
  }

  const { stakekeyInfo } = walletData;
  const mainIdentifier = stakekeyInfo.stakekey || stakekeyInfo.addressList[0];

  const getTabStyle = (tab) => {
    const baseStyle = "tab-custom cursor-pointer";
    const isDetailsTab = detailsTabs.includes(tab);
    const isLoading = isLoadingDetails && isDetailsTab;
    
    return [
      baseStyle,
      activeTab === tab ? "tab-custom-active" : "",
      isLoading ? "animate-pulse" : "",
      (!isDetailsTab || detailsData || isLoading) ? "" : "opacity-60"
    ].filter(Boolean).join(" ");
  };

  const renderAddressesList = () => (
    <div>
      <h2 className="text-lg font-bold mb-4 text-center">
        Addresses ({stakekeyInfo.numberOfAddresses})
      </h2>
      {stakekeyInfo.addressList.map((address, index) => (
        <div key={index} className="mb-4 card bg-base-100 shadow-2xl rounded-lg overflow-hidden">
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
  );

  const renderContent = () => {
    if (isLoadingDetails && detailsTabs.includes(activeTab)) {
      return (
        <div className="mt-8">
          <LoadingProgress 
            totalTransactions={stakekeyInfo.totalTransactions} 
            nbAddresses={stakekeyInfo.numberOfAddresses} 
          />
        </div>
      );
    }

    switch (activeTab) {
      case 'addresses':
        return renderAddressesList();
      
      case 'hold':
        return (
          <WalletHold 
            holdingsData={{ 
              holdings: sortedHoldings,
            }} 
          />
        );
      
      case 'activity':
        return detailsData && (
          <ActivityCharts 
            stakekey={stakekeyInfo.stakekey} 
            detailsData={detailsData} 
          />
        );
      
      case 'historic':
        return detailsData && (
          <HistoricCharts 
            data={detailsData.full_dataset} 
          />
        );
      
      case 'friends':
        return detailsData && (
          <WalletFriends 
            stakekey={stakekeyInfo.stakekey} 
            friendsData={detailsData} 
          />
        );
      
      case 'transactions':
        return detailsData?.full_dataset && (
          <TransactionsTab 
            transactions={detailsData.full_dataset.map(tx => ({
              hash: tx.txHash,
              timestamp: tx.timestamp,
            }))} 
          />
        );
      
      case 'json':
        return (
          <div className="shadow-xl">
            <h2 className="text-lg font-bold mb-2">JSON Data</h2>
            <pre className="overflow-auto max-h-[600px]">
              {JSON.stringify(walletData, null, 2)}
            </pre>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">Wallet Details</h1>
      
      {/* Handle */}
      <div className="mb-4">
        <GetHandle stakekey={mainIdentifier} />
      </div>

      {/* Main Info */}
      <div className="mb-4">
        <div>
          <strong>{stakekeyInfo.stakekey ? "Stake Address:" : "Address:"}</strong>
          <CopyButton text={mainIdentifier} />
          {shortener(mainIdentifier)}
        </div>

        {!stakekeyInfo.stakekey && (
          <div className="text-sm text-gray-500">
            Single address (no stakekey)
          </div>
        )}

        {/* Balance */}
        <h2 className="text-xl font-bold mb-4 text-center">
          <img 
            src="/assets/cardano.webp" 
            alt="ADA" 
            className="iconCurrency inline-block mr-2 rounded-full w-6 h-6"
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {formattedBalance.integer}
          {formattedBalance.decimal && (
            <span className="text-sm text-gray-400 opacity-70">
              .{formattedBalance.decimal}
            </span>
          )}
          {' '}ADA
        </h2>

        {/* Stats */}
        <div className="mb-2 flex gap-4 justify-center items-center">
          <p>
            {stakekeyInfo.stakekey && (
              <>
                <strong>Addresses:</strong> {stakekeyInfo.numberOfAddresses} |{' '}
              </>
            )}
            <strong>Transactions:</strong> {stakekeyInfo.totalTransactions}
          </p>
        </div>

        {/* Transaction limit warning */}
        {isTransactionLimitExceeded && (
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

        {/* Pool Info */}
        {stakekeyInfo.stakepool && (
          <div className="mb-2">
            <strong>Pool:</strong>
            <Link 
              className="text-sky-500 ml-1" 
              to={`/pool/${stakekeyInfo.stakepool.pool_id}`}
            >
              {stakekeyInfo.stakepool.ticker || 'Unknown Ticker'}
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs mt-6 mb-6 flex justify-center items-center">
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

      {/* Content */}
      {renderContent()}
    </div>
  );
}

export default WalletPage;