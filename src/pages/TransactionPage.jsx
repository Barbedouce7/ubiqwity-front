import React, { useState, useEffect, useContext, useCallback } from 'react';
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
  const [activeTab, setActiveTab] = useState('diagram');
  const [resolvedAmounts, setResolvedAmounts] = useState({});
  const [tokenUnits, setTokenUnits] = useState([]);
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);

  // Assuming fetchTokenData can handle batch requests, if not, you'll need to modify the backend
  const batchFetchTokenData = useCallback((units) => {
    return fetchTokenData(units); // This should return a Promise resolving to an object or array of metadata
  }, [fetchTokenData]);

  useEffect(() => {
    if (!txId) return;
    let ignore = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}tx/${txId}`);
        
        const newResolvedAmounts = {};
        const unitsToFetch = new Set();

        // Collect all units to be fetched
        for (let io of [...response.data.utxos.inputs, ...response.data.utxos.outputs]) {
          const ioType = response.data.utxos.inputs.includes(io) ? 'input' : 'output';
          const index = io.output_index ?? io.index ?? 'unknown';  
          
          const amounts = io.amount.map((a) => {
            if (a.unit !== 'lovelace') {
              unitsToFetch.add(a.unit);
            }
            return { ...a };
          });

          if (!ignore) {
            newResolvedAmounts[`${ioType}-${index}`] = amounts;
          }
        }

        // Fetch token data in batch
        const tokenData = await batchFetchTokenData([...unitsToFetch]);
        const unknownUnits = new Set([...unitsToFetch].filter(unit => !(unit in tokenData)));

        if (!ignore) {
          setTokenUnits([...unknownUnits]);
          setData(response.data);
          setResolvedAmounts(newResolvedAmounts);
        }
      } catch (error) {
        if (!ignore) {
          console.error('Error fetching data:', error);
          setError('An error occurred while fetching data');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
    };
  }, [txId, batchFetchTokenData]);

  if (loading) return <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">Transaction Details</h1>
      <div className="mb-4">
        <div className="mb-2">
          <strong>Transaction Hash:</strong><CopyButton text={data.transaction} /> {data.transaction}
        </div>
        <div className="mb-2">
          <strong>Block Hash:</strong> <CopyButton text={data.block.hash} /><span className="line-clamp-3 ml-2">{data.block.hash}</span>
        </div>
        <div className="mb-2">
          <strong>Block Number:</strong> {data.block.height}
        </div>
        <div><strong>Date:</strong> {new Date(data.block.time * 1000).toLocaleString()}</div> {/* Convert to milliseconds */}
        <div className="mb-2"><strong>Fees:</strong> {data.fees} ADA</div>
        <div className="mb-2"><strong>Size:</strong> {data.size} bytes</div>
      </div>

      <div className="tabs mt-6 mb-6 flex justify-center items-center">
        <div className="tabs mb-4 flex justify-center items-center">
          <a className={`tab-custom ${activeTab === 'diagram' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('diagram')}>Diagram</a>
          <a className={`tab-custom ${activeTab === 'eutxo' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('eutxo')}>eUTXO</a>
          <a className={`tab-custom ${activeTab === 'json' ? 'tab-custom-active' : ''}`} onClick={() => setActiveTab('json')}>JSON</a>
        </div>
      </div>

      {activeTab === 'eutxo' && <EUTXOTab inputs={data.utxos.inputs} outputs={data.utxos.outputs} resolvedAmounts={resolvedAmounts} tokenMetadata={tokenMetadata} />}
      {activeTab === 'diagram' && <DiagramTab inputs={data.utxos.inputs} outputs={data.utxos.outputs}  tokenMetadata={tokenMetadata}/>}
      {activeTab === 'json' && <JSONTab data={data} />}
    </div>
  );
}

export default TransactionPage;