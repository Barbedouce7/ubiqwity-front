import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { copyToClipboard } from '../utils/utils';
import EUTXOTab from '../components/EUTXOTab';
import DiagramTab from '../components/DiagramTab';
import JSONTab from '../components/JSONTab';
import { TokenContext } from '../utils/TokenContext';
import CopyButton from '../components/CopyButton';

function TransactionPage() {
  const { txId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('eutxo');
  const [resolvedAmounts, setResolvedAmounts] = useState({});
  const [tokenUnits, setTokenUnits] = useState([]);
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}tx/${txId}`);
        
        const newResolvedAmounts = {};
        const unitsToFetch = new Set();

        const checkToken = async (unit) => {
          const tokenData = await fetchTokenData(unit);
          return tokenData !== undefined && tokenData !== null;
        };

        for (let io of [...response.data.utxos.inputs, ...response.data.utxos.outputs]) {
          const ioType = response.data.utxos.inputs.includes(io) ? 'input' : 'output';
          const index = io.output_index ?? io.index ?? 'unknown';  // Handle both input and output index
          
          const amounts = await Promise.all(io.amount.map(async (a) => {
            if (a.unit !== 'lovelace') {
              if (!(await checkToken(a.unit))) {
                unitsToFetch.add(a.unit);
              }
            }
            return { ...a };
          }));

          newResolvedAmounts[`${ioType}-${index}`] = amounts;
        }

        setTokenUnits([...unitsToFetch]);
        setData(response.data);
        setResolvedAmounts(newResolvedAmounts);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('An error occurred while fetching data');
        setLoading(false);
      }
    };

    fetchData();
  }, [txId, fetchTokenData]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  if (!data) return null;

return (
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-bold mb-4">Transaction Details</h1>
    <div className="mb-4">
       <div className="mb-4">
        <div className="mb-2">
          <div className="mb-2"><strong>Transaction Hash:</strong><CopyButton text={data.transaction} /> {data.transaction}</div>
          <strong>Block Hash:</strong> <CopyButton text={data.block.hash} /><span className="line-clamp-3 ml-2">{data.block.hash}</span>
        </div>
        <div className="mb-2">
          <strong>Block Number:</strong> {data.block.height}
        </div>
        <div><strong>Date:</strong> {new Date(data.block.time).toLocaleString()}</div>

        <div className="mb-2"><strong>Fees:</strong> {data.fees} ADA</div>
        <div className="mb-2"><strong>Size:</strong> {data.size} bytes</div>
      </div>
    </div>

    <div className="tabs mb-4">
      <a 
        className={`tab tab-bordered ${activeTab === 'eutxo' ? 'tab-active' : ''}`} 
        onClick={() => setActiveTab('eutxo')}
      >
        eUTXO
      </a>
      <a 
        className={`tab tab-bordered ${activeTab === 'diagram' ? 'tab-active' : ''}`} 
        onClick={() => setActiveTab('diagram')}
      >
        Diagram
      </a>
      <a 
        className={`tab tab-bordered ${activeTab === 'json' ? 'tab-active' : ''}`} 
        onClick={() => setActiveTab('json')}
      >
        JSON
      </a>
    </div>

    {activeTab === 'eutxo' && <EUTXOTab inputs={data.utxos.inputs} outputs={data.utxos.outputs} resolvedAmounts={resolvedAmounts} tokenMetadata={tokenMetadata} />}
    {activeTab === 'diagram' && <DiagramTab />}
    {activeTab === 'json' && <JSONTab data={data} />}
  </div>
);
}

export default TransactionPage;