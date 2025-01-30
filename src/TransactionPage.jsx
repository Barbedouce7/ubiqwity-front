import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from './apiConfig';
import { copyToClipboard } from './utils';
import EUTXOTab from './EUTXOTab';
import DiagramTab from './DiagramTab';
import JSONTab from './JSONTab';

function TransactionPage() {
  const { txId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('eutxo');
  const [resolvedAmounts, setResolvedAmounts] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}tx/${txId}`);
        
        const newResolvedAmounts = {};
        const promises = [];

        // Process each input and output
        [...response.data.utxos.inputs, ...response.data.utxos.outputs].forEach((io, index) => {
          const ioType = io === response.data.utxos.inputs[index] ? 'input' : 'output';
          promises.push(
            Promise.all(io.amount.map(async (a) => {
              if (a.unit !== 'lovelace') {
                const metadata = await axios.get(`https://tokens.cardano.org/metadata/${a.unit}`);
                const ticker = metadata.data.ticker?.value || a.unit;
                const decimals = metadata.data.decimals?.value || 0;
                const logo = metadata.data.logo?.value;
                return {
                  ...a,
                  unit: ticker,
                  originalUnit: a.unit,
                  decimals: decimals,
                  logo: logo
                };
              }
              return {
                ...a,
                unit: 'ADA',
                decimals: 6
              };
            })).then(amounts => {
               newResolvedAmounts[`${ioType}-${index}`] = amounts;
            })
          );
        });

        await Promise.all(promises);
        setData(response.data);
        setResolvedAmounts(newResolvedAmounts); 
        setLoading(false);
        //console.log('resolvedAmounts:', newResolvedAmounts); 

      } catch (error) {
        setError('An error occurred while fetching data');
        setLoading(false);
      }
    };

    fetchData();
  }, [txId]);



  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction Details</h1>
      <div className="mb-4">
        <div className="mb-2">
          <div className="mb-2"><strong>Transaction Hash:</strong> {data.transaction}</div>
          <strong>Block Hash:</strong> 
          <button 
            className="btn btn-xs ml-2" 
            onClick={() => copyToClipboard(data.block.hash)}
          >
            Copy
          </button>
          <span className="line-clamp-3 ml-2">{data.block.hash}</span>
        </div>
        <div className="mb-2">
          <strong>Block Number:</strong> {data.block.height}
        </div>
        <div><strong>Date:</strong> {new Date(data.block.time).toLocaleString()}</div>

        <div className="mb-2"><strong>Fees:</strong> {data.fees} ADA</div>
        <div className="mb-2"><strong>Size:</strong> {data.size} bytes</div>
      </div>

      <div className="tabs mb-4">
        <a className={`tab tab-bordered ${activeTab === 'eutxo' ? 'tab-active' : ''}`} onClick={() => setActiveTab('eutxo')}>eUTXO</a> 
        <a className={`tab tab-bordered ${activeTab === 'diagram' ? 'tab-active' : ''}`} onClick={() => setActiveTab('diagram')}>Diagram</a>
        <a className={`tab tab-bordered ${activeTab === 'json' ? 'tab-active' : ''}`} onClick={() => setActiveTab('json')}>JSON</a>
      </div>

      {activeTab === 'eutxo' && <EUTXOTab inputs={data.utxos.inputs} outputs={data.utxos.outputs} resolvedAmounts={resolvedAmounts} />}
      {activeTab === 'diagram' && <DiagramTab />}
      {activeTab === 'json' && <JSONTab data={data} />}
    </div>
  );
}

export default TransactionPage;