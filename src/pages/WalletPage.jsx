import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import CopyButton from '../components/CopyButton';
import WalletHold from '../components/WalletHold';
import WalletFriends from '../components/WalletFriends';
import ActivityCharts from '../components/ActivityCharts';
import HistoricCharts from '../components/HistoricCharts';
import TransactionsTab from '../components/TransactionsTab';
import WalletDelegations from '../components/WalletDelegations';
import LoadingProgress from '../components/LoadingProgress';
import { shortener } from '../utils/utils';
import GetHandle from '../components/GetHandle';
import { ExclamationTriangleIcon, QuestionMarkCircleIcon } from "@heroicons/react/20/solid";
import WalletCommunityNotes from '../components/WalletCommunityNotes';
import { XMarkIcon } from '@heroicons/react/24/outline';

const AddressModal = ({ addresses, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  const handleModalClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-base-100 rounded-lg shadow-xl p-4 max-w-2xl w-11/12 flex flex-col max-h-[80vh]"
        onClick={handleModalClick}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Addresses ({addresses.length})
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-base-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {addresses.map((address, index) => (
            <div key={index} className="mb-3 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <Link className="text-primary hover:text-primary/50 break-all" to={`/address/${address}`}>
                  {address}
                </Link>
                <CopyButton text={address} className="ml-2 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function WalletPage() {
  const { walletAddress } = useParams();
  const [walletData, setWalletData] = useState(null);
  const [walletDataHold, setWalletDataHold] = useState(null);
  const [detailsData, setDetailsData] = useState(null);
  const [delegationData, setDelegationData] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadedTransactions, setLoadedTransactions] = useState(0);
  const [error, setError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const tooltipRef = useRef(null);

  const TRANSACTION_LIMIT = 40000;
  const allTabs = ['details', 'holdings', 'delegations', 'historic', 'activity', 'friends', 'transactions'];

  // Computed states
  const hasNativeTokens = useMemo(() => {
    return walletDataHold?.holdings?.some(h => h.unit !== "lovelace" && Number(h.quantity) > 0) || false;
  }, [walletDataHold?.holdings]);

  const isTransactionLimitExceeded = useMemo(() => {
    return (walletDataHold?.stakekeyInfo?.totalTransactions || 0) > TRANSACTION_LIMIT;
  }, [walletDataHold?.stakekeyInfo?.totalTransactions]);

  const availableTabs = useMemo(() => {
    const baseTabs = ['details', 'holdings'];
    if (walletData?.stakekeyInfo?.stakekey) {
      baseTabs.push('delegations');
    }
    if (walletDataHold?.stakekeyInfo?.totalTransactions > 0 && !isTransactionLimitExceeded) {
      baseTabs.push('historic', 'activity', 'friends', 'transactions');
    }
    return baseTabs;
  }, [isTransactionLimitExceeded, walletDataHold?.stakekeyInfo?.totalTransactions, walletData?.stakekeyInfo?.stakekey]);

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

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!walletAddress) {
        setError('Wallet address is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const walletResponse = await axios.get(`${API_CONFIG.baseUrl}wallet/${walletAddress}`);
        setWalletData(walletResponse.data);

        const identifier = walletResponse.data.stakekeyInfo.stakekey || walletResponse.data.stakekeyInfo.addressList[0];
        
        const [holdResponse, delegationResponse] = await Promise.all([
          axios.get(`${API_CONFIG.baseUrl}wallet/${identifier}/hold`),
          axios.get(`${API_CONFIG.baseUrl}wallet/${identifier}/deleghistory`)
        ]);

        setWalletDataHold(holdResponse.data);
        setDelegationData(delegationResponse.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch wallet data');
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      setWalletData(null);
      setWalletDataHold(null);
      setDetailsData(null);
      setDelegationData(null);
      setActiveTab('details');
      setLoadedTransactions(0);
      setError(null);
    };
  }, [walletAddress]);

  // Details data fetch
  useEffect(() => {
    const fetchDetailsData = async () => {
      if (!walletData?.stakekeyInfo || detailsData || isTransactionLimitExceeded) return;

      setIsLoadingDetails(true);
      try {
        const identifier = walletData.stakekeyInfo.stakekey || walletData.stakekeyInfo.addressList[0];
        const response = await axios.get(`${API_CONFIG.baseUrl}wallet/${identifier}/details`);
        
        const totalTx = walletDataHold?.stakekeyInfo.totalTransactions || 0;
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
        console.error('Error fetching details:', error);
        setIsLoadingDetails(false);
      }
    };

    fetchDetailsData();
  }, [walletData, detailsData, isTransactionLimitExceeded, walletDataHold?.stakekeyInfo?.totalTransactions]);

  // Tooltip handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTooltip && tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

  const handleTabChange = (tab) => {
    if (availableTabs.includes(tab)) setActiveTab(tab);
  };

  const handleTooltipInteraction = () => {
    setShowTooltip(!showTooltip);
  };

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

  // Render functions
  const renderAddressButton = () => (
    <div className="mb-4">
      <button
        onClick={() => setShowAddressModal(true)}
        className="flex items-center justify-between mx-auto rounded-lg transition-colors"
      >
        <span className="font-semibold">
          Addresses: {stakekeyInfo.numberOfAddresses}
        </span>
        <span className="text-sm bg-sky-700/50 px-2 py-1 rounded ml-4">View All</span>
      </button>
    </div>
  );

  const renderDetailsInfo = () => (
    <div className="card rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {!stakekeyInfo.stakekey && (
            <div className="text-xs text-gray-500 mb-2">
              Single address (no stakekey)
            </div>
          )}
          {stakekeyInfo.stakepool && (
            <div className="mb-2">
              <strong>Delegated to:</strong>
              <Link 
                className="text-sky-500 ml-1" 
                to={`/pool/${stakekeyInfo.stakepool.pool_id}`}
              >
                {stakekeyInfo.stakepool.ticker || 'Unknown Ticker'}
              </Link>
            </div>
          )}
          {walletDataHold?.stakekeyInfo && (
            <div className="relative" ref={tooltipRef}>
              <strong>
                Transactions:{' '}
                {walletDataHold?.stakekeyInfo.numberOfAddresses > 1 && (
                  <span 
                    className="inline-block"
                    onClick={handleTooltipInteraction}
                    onMouseEnter={() => window.innerWidth > 768 && setShowTooltip(true)}
                    onMouseLeave={() => window.innerWidth > 768 && setShowTooltip(false)}
                  >
                    <QuestionMarkCircleIcon className="w-5 h-5 inline-block align-middle cursor-pointer text-gray-500 hover:text-blue-500 ml-1 mr-1 mb-1" />
                  </span>
                )}
              </strong>
              {walletDataHold?.stakekeyInfo.totalTransactions > TRANSACTION_LIMIT ? (
                <span className="text-red-500">{walletDataHold?.stakekeyInfo.totalTransactions}</span>
              ) : (
                walletDataHold?.stakekeyInfo.totalTransactions || 0
              )}
              {isTransactionLimitExceeded && (
                <div className="flex items-center justify-center space-x-2 mt-1">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                  <span className="text-xs text-red-500">
                    Too many transactions: Limited functionality
                  </span>
                </div>
              )}
              {showTooltip && walletDataHold?.stakekeyInfo.numberOfAddresses > 1 && (
                <div className="absolute z-10 w-64 p-2 mt-2 text-sm text-gray-700 bg-base-100 border border-sky-300/30 rounded-lg shadow-lg">
                  Transaction count may include duplicates across multiple addresses.
                </div>
              )}
            </div>
          )}
        </div>
        <div>{renderAddressButton()}</div>
      </div>
      <div className="mt-6">
        <WalletCommunityNotes walletAddress={mainIdentifier} />
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoadingDetails && ['historic', 'activity', 'friends', 'transactions'].includes(activeTab)) {
      return (
        <div className="mt-8">
          <LoadingProgress 
            totalTransactions={walletDataHold?.stakekeyInfo.totalTransactions} 
            nbAddresses={stakekeyInfo.numberOfAddresses} 
            loadedTransactions={loadedTransactions}
          />
        </div>
      );
    }

    switch (activeTab) {
      case 'details':
        return renderDetailsInfo();
      case 'holdings':
        return <WalletHold holdingsData={{ holdings: sortedHoldings }} />;
      case 'delegations':
        return <WalletDelegations delegationData={delegationData} />;
      case 'historic':
        return detailsData && <HistoricCharts data={detailsData.full_dataset} />;
      case 'activity':
        return detailsData && <ActivityCharts stakekey={stakekeyInfo.stakekey} detailsData={detailsData} />;
      case 'friends':
        return detailsData && <WalletFriends stakekey={stakekeyInfo.stakekey} friendsData={detailsData} />;
      case 'transactions':
        return detailsData?.full_dataset && (
          <TransactionsTab 
            transactions={detailsData.full_dataset.map(tx => ({
              hash: tx.txHash,
              timestamp: tx.timestamp,
              scripts: tx.scripts,
            }))} 
          />
        );
      default:
        return null;
    }
  };

  const getTabStyle = (tab) => {
    const isDetailsTab = ['historic', 'activity', 'friends', 'transactions'].includes(tab);
    return [
      "tab-custom cursor-pointer",
      activeTab === tab ? "tab-custom-active" : "",
      isLoadingDetails && isDetailsTab ? "animate-pulse" : "",
      isDetailsTab && !detailsData && !isLoadingDetails ? "opacity-60 cursor-not-allowed" : ""
    ].filter(Boolean).join(" ");
  };

  return (
    <div className="container mx-auto p-4 text-base-content">
      <div className="mb-8">
        <div className="flex flex-col items-center mb-4">
          <div className="flex flex-col sm:flex-row items-center mb-2">
            <h1 className="text-xl font-bold mb-2 sm:mb-0">Wallet Details:</h1>
            <div className="flex items-center ml-0 sm:ml-2">
              <GetHandle stakekey={mainIdentifier} />
              <span className="text-sm ml-2">{shortener(mainIdentifier)}</span>
              <CopyButton text={mainIdentifier} className="ml-1" />
            </div>
          </div>
          <div className="mt-4 w-full max-w-xs">
            <h2 className="text-xl font-bold text-center border border-sky-500/50 rounded p-2">
              <img 
                src="/assets/cardano.webp" 
                alt="ADA" 
                className="iconCurrency inline-block mr-2 mb-1 rounded-full w-6 h-6"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {formattedBalance.integer}
              {formattedBalance.decimal && (
                <span className="text-sm text-gray-400 opacity-70">.{formattedBalance.decimal}</span>
              )}
              {' '}ADA
            </h2>
          </div>
        </div>
      </div>

      <div className="tabs mt-4 mb-6 flex flex-wrap justify-center items-center">
        {allTabs.map(tab => (
          availableTabs.includes(tab) && (
            <a 
              key={tab}
              className={getTabStyle(tab)}
              onClick={() => handleTabChange(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </a>
          )
        ))}
      </div>

      {renderContent()}

      <AddressModal 
        addresses={stakekeyInfo.addressList || []}
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
      />
    </div>
  );
}

export default WalletPage;
