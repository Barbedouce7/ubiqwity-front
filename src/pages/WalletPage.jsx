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
import { ExclamationTriangleIcon, QuestionMarkCircleIcon } from "@heroicons/react/20/solid";

function WalletPage() {
  const { walletAddress } = useParams();
  const [walletData, setWalletData] = useState(null);
  const [walletDataHold, setWalletDataHold] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [activeTab, setActiveTab] = useState('addresses');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHold, setIsLoadingHold] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadedTransactions, setLoadedTransactions] = useState(0);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Constants
  const TRANSACTION_LIMIT = 3000;
  const detailsTabs = ['historic', 'activity', 'friends', 'transactions'];

  // Computed states using useMemo
  const hasNativeTokens = useMemo(() => {
    if (!walletDataHold?.holdings) return false;
    return walletDataHold.holdings.some(h => h.unit !== "lovelace" && Number(h.quantity) > 0);
  }, [walletDataHold?.holdings]);

  const isTransactionLimitExceeded = useMemo(() => {
    return walletDataHold?.totalTransactions > TRANSACTION_LIMIT;
  }, [walletDataHold?.totalTransactions]);

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
    if (!walletDataHold?.holdings) return [];
    return [...walletDataHold.holdings].sort((a, b) => {
      const aLabel = a.name || a.ticker || "";
      const bLabel = b.name || b.ticker || "";
      return aLabel ? (bLabel ? aLabel.localeCompare(bLabel) : -1) : (bLabel ? 1 : a.unit.localeCompare(b.unit));
    });
  }, [walletDataHold?.holdings]);

  const formattedBalance = useMemo(() => {
    const adaHolding = walletDataHold?.holdings?.find(h => h.unit === "lovelace");
    if (!adaHolding?.quantity) return { integer: "0", decimal: "" };
    
    const balance = (Number(adaHolding.quantity) / 1000000).toFixed(6);
    const [integer, decimal] = balance.split('.');
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return { integer: formattedInteger, decimal };
  }, [walletDataHold?.holdings]);

  // Primary data fetch
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
        
        // Immediately fetch holding data after wallet data
        try {
          setIsLoadingHold(true);
          const identifier = response.data.stakekeyInfo.stakekey || response.data.stakekeyInfo.addressList[0];
          const holdResponse = await axios.get(`${API_CONFIG.baseUrl}wallet/${identifier}/hold`);
          setWalletDataHold(holdResponse.data);
        } catch (holdError) {
          console.error("Failed to fetch holding data:", holdError);
        } finally {
          setIsLoadingHold(false);
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch wallet data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();

    return () => {
      setWalletData(null);
      setWalletDataHold(null);
      setDetailsData(null);
      setActiveTab('addresses');
      setLoadedTransactions(0);
      setError(null);
    };
  }, [walletAddress]);

  // Details data fetch
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
        const totalTx = walletDataHold?.totalTransactions || 0;
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
  }, [activeTab, walletData, detailsData, isTransactionLimitExceeded, walletDataHold?.totalTransactions]);

  // Click outside tooltip handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTooltip && !event.target.closest('.relative.inline-block')) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

  // Loading and error states
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
            totalTransactions={walletDataHold?.stakekeyInfo.totalTransactions} 
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
          isLoadingHold ? (
            <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-4" />
          ) : (
            <WalletHold 
              holdingsData={{ 
                holdings: sortedHoldings,
              }} 
            />
          )
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
          <strong>{stakekeyInfo.stakekey ? "Stake Address: " : "Address: "}</strong> 
          {shortener(mainIdentifier)}<CopyButton text={mainIdentifier} />
        </div>

        {!stakekeyInfo.stakekey && (
          <div className="text-xs text-gray-500">
            Single address (no stakekey)
          </div>
        )}

        {/* Balance */}
        <h2 className="text-xl font-bold mb-4 text-center border border-sky-500/50 rounded inline-block mx-auto p-2">
          <img 
            src="/assets/cardano.webp" 
            alt="ADA" 
            className="iconCurrency inline-block mr-2 mb-1 rounded-full w-6 h-6"
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
        <div className="mb-2 flex gap-4 justify-center items-center relative">
          <p>

                <strong>Addresses:</strong> {stakekeyInfo.numberOfAddresses} |{' '}

            {walletDataHold?.stakekeyInfo && (
              <>
            <strong>
              Transactions:
              {stakekeyInfo.numberOfAddresses > 1 && (walletDataHold?.stakekeyInfo.totalTransactions > TRANSACTION_LIMIT ) && (
                <QuestionMarkCircleIcon
                  className="w-5 h-5 inline-block align-middle cursor-pointer text-gray-500 hover:text-blue-500 ml-1 mb-1"
                  onClick={() => setShowTooltip(!showTooltip)}
                />
              )}
            </strong> {walletDataHold?.stakekeyInfo.totalTransactions}
            </>
            )}
          </p>
          {stakekeyInfo.numberOfAddresses > 1 && showTooltip && (
            <div 
              className="absolute z-10 w-64 p-2 mt-2 text-sm text-gray-700 bg-base-100 border border-sky-300/30 rounded-lg shadow-lg tooltip"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            >
              The transaction count shown here may include duplicates since a single transaction can involve multiple addresses and be counted multiple times (unlike in the 'transactions' tab).
            </div>
          )}
        </div>

        {/* Transaction limit warning */}
      {(isTransactionLimitExceeded || (!walletDataHold?.stakekeyInfo.totalTransactions)) && (
        <div className="flex items-center justify-center space-x-2 mb-4">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-500">
            Too many transactions: <br />limited user experience
          </span>
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