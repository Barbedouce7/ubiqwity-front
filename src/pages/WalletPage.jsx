import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import CopyButton from '../components/CopyButton';

function WalletPage() {
  const { stakekey } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}wallet/${stakekey}`);
        
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        setError('An error occurred while fetching wallet data');
        setLoading(false);
      }
    };

    fetchData();
  }, [stakekey]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  if (!data) return null;

  const { stakekeyInfo, transactions } = data;

  return (
    <div className="container mx-auto p-4">
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
        
        <h2 className="text-xl font-bold mt-4 mb-2">Stake Pool</h2>
        <div className="mb-2">
          <Link to={`/pool/${stakekeyInfo.stakepool.pool_id}`}>
            {stakekeyInfo.stakepool.ticker}
          </Link>        </div>

        <div className="mb-2">
          <strong>Homepage:</strong> 
          <a href={stakekeyInfo.stakepool.homepage} target="_blank" rel="noopener noreferrer">
            {stakekeyInfo.stakepool.homepage}
          </a>
        </div>
      </div>

      <div className="tabs mb-4">
        <a className={`tab tab-bordered ${activeTab === 'stats' ? 'tab-active' : ''}`} onClick={() => setActiveTab('stats')}> Stats</a>
        <a className={`tab tab-bordered ${activeTab === 'transactions' ? 'tab-active' : ''}`}  onClick={() => setActiveTab('transactions')}> Transactions</a>
        <a className={`tab tab-bordered ${activeTab === 'json' ? 'tab-active' : ''}`}  onClick={() => setActiveTab('json')}> JSON</a>
      </div>

      {activeTab === 'stats' && (
        <div>
        Stats - W.I.P
        </div>
      )}

      {activeTab === 'transactions' && (
 <div>
  <h2 className="text-lg font-bold mb-4 text-center">Transactions</h2>
  {transactions.map((tx, index) => (
    <div key={index} className="mb-4 card bg-slate-900 text-white shadow-2xl rounded-lg overflow-hidden">
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
          <strong>Hash:</strong>
          <Link className="text-cyan-200 hover:text-cyan-100" to={`/tx/${tx.txHash}`}>
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
        <div>
          <h2 className="text-lg font-bold mb-2">JSON Data</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default WalletPage;