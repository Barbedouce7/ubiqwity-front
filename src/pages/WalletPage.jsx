import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import CopyButton from '../components/CopyButton';
import WalletHold from '../components/WalletHold';
import { shortener } from '../utils/utils';


function WalletPage() {
  const { walletAddress } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('addresses');

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) {
        setError('Stake key is missing or undefined.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}wallet/${walletAddress}`);
        setData(response.data);
      } catch (error) {
        if (error.response && error.response.status === 400) {
          if (error.response.data.message) {
            setError(error.response.data.message);
          } else {
            setError('Bad request. Please try again.');
          }
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

  if (loading) return <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  if (!data || !data.stakekeyInfo) return <div>No wallet data available</div>;

  const { stakekeyInfo, transactions } = data;

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">Wallet Details</h1>
      <div className="mb-4">
        <div className="mb-2">
          <strong>Stake Address:</strong> 
          <CopyButton text={stakekeyInfo.stakekey} /> 
          {stakekeyInfo.stakekey}
        </div>
        <div className="mb-2">
          <strong>Number of Addresses:</strong> {stakekeyInfo.numberOfAddresses}
        </div>
        
        <div className="mb-2">
          {stakekeyInfo.stakepool ? (
            <Link className="text-sky-500" to={`/pool/${stakekeyInfo.stakepool.pool_id}`}>
              {stakekeyInfo.stakepool.ticker || 'Unknown Ticker'}
            </Link>
          ) : (
            <p>No stake pool information available</p>
          )}
        </div>

        <div className="mb-2">
          {stakekeyInfo.stakepool && stakekeyInfo.stakepool.homepage ? (
            <>
              <strong>Homepage:</strong> 
              <a href={stakekeyInfo.stakepool.homepage} target="_blank" rel="noopener noreferrer">
                {stakekeyInfo.stakepool.homepage}
              </a>
            </>
          ) : (
            <p></p>
          )}
        </div>
      </div>

      <div className="tabs mt-6 mb-6 flex justify-center items-center">
        <div className="tabs">
          <a className={`tab-custom ${activeTab === 'addresses' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('addresses')}>Addresses</a>
          <a className={`tab-custom ${activeTab === 'hold' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('hold')}>Hold</a>
          <a className={`tab-custom ${activeTab === 'history' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('history')}>History</a>
          <a className={`tab-custom ${activeTab === 'friends' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('friends')}>Friends</a>
          <a className={`tab-custom ${activeTab === 'transactions' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('transactions')}>Transactions</a>
          <a className={`tab-custom ${activeTab === 'json' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('json')}>JSON</a>
        </div>
      </div>
      {activeTab === 'addresses' && (
    <div>
      <h2 className="text-lg font-bold mb-4 text-center">Addresses</h2>
      {stakekeyInfo.addressList.map((address, index) => (
        <div key={index} className="mb-4 card text-base-content bg-base-100 text-white shadow-2xl rounded-lg overflow-hidden">
          <div className="card-body p-4">
            <div className="">
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
      {activeTab === 'hold' && (
        <div>
          <WalletHold walletAddress={stakekeyInfo.stakekey} />
        </div>
      )}
      
      {activeTab === 'history' && (
        <div>
          Historic display - W.I.P
        </div>
      )}
      
      {activeTab === 'friends' && (
        <div>
          Friends wallet display - W.I.P
        </div>
      )}

      {activeTab === 'transactions' && transactions && (
        <div>
          <h2 className="text-lg font-bold mb-4 text-center">Transactions</h2>
          {transactions.map((tx, index) => (
            <div key={index} className="mb-4 card text-base-content bg-base-100 text-white shadow-2xl rounded-lg overflow-hidden">
              <div className="card-body p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">
                    <strong>Date:</strong> {new Date(tx.blockTime * 1000).toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold">
                    <strong>Block Height:</strong> {tx.blockHeight}
                  </span>
                </div>
                <div className="text-left">
                  <strong>Hash: </strong>
                  <Link className="text-primary hover:text-cyan-100" to={`/tx/${tx.txHash}`}>
                    {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-10)}
                  </Link>
                  <CopyButton text={tx.txHash} className="ml-2" />
                </div>
              </div>
            </div>
          ))}
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