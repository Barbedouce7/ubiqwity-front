import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from './apiConfig';

function TransactionPage() {
  const { txId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('utxo');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}tx/${txId}`);
        setData(response.data);
        setLoading(false);
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard!');
    });
  };

  const getColorForAddress = (address) => {
    // Génère une couleur unique basée sur l'adresse
    return '#' + address.slice(0, 6).split('').map(char => char.charCodeAt(0).toString(16)).join('');
  };

  const convertLovelaceToAda = (lovelace) => {
    return (parseInt(lovelace) / 1_000_000).toFixed(2) + ' ADA';
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction Details</h1>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2">
            <strong>Block Hash:</strong> 
            <button 
              className="btn btn-xs btn-primary ml-2" 
              onClick={() => copyToClipboard(data.block.hash)}
            >
              Copy
            </button>
            <span className="line-clamp-3 ml-2">{data.block.hash}</span>
          </p>
          <p className="mb-2">
            <strong>Block Number:</strong> {data.block.height}
          </p>
          <p><strong>Date:</strong> {new Date(data.block.time).toLocaleString()}</p>
        </div>
        <div>
          <p className="mb-2">
            <strong>Transaction Hash:</strong> 
            <button 
              className="btn btn-xs btn-primary ml-2" 
              onClick={() => copyToClipboard(data.transaction)}
            >
              Copy
            </button>
            <span className="line-clamp-3 ml-2">{data.transaction}</span>
          </p>
          <p className="mb-2"><strong>Fees:</strong> {data.fees} ADA</p>
          <p className="mb-2"><strong>Size:</strong> {data.size} bytes</p>

        </div>
      </div>

      <div className="tabs mb-4">
        <a className={`tab tab-bordered ${activeTab === 'utxo' ? 'tab-active' : ''}`} onClick={() => setActiveTab('utxo')}>UTXO</a> 
        <a className={`tab tab-bordered ${activeTab === 'diagram' ? 'tab-active' : ''}`} onClick={() => setActiveTab('diagram')}>Diagram</a>
      </div>

      {activeTab === 'utxo' ? (
        <div>
          <h2 className="text-xl font-bold mb-2">Inputs</h2>
          {data.utxos.inputs.map((input, index) => (
            <div key={index} className="card bg-base-300 shadow-xl mb-4">
              <div className="card-body">
                <h3 className="card-title">Input {index + 1}</h3>
                <p className="line-clamp-3" style={{ color: getColorForAddress(input.address) }}>
                  <strong>Address:</strong> 
                  <button 
                    className="btn btn-xs btn-primary ml-2" 
                    onClick={() => copyToClipboard(input.address)}
                  >
                    Copy
                  </button>
                  <span className="ml-2">{input.address}</span>
                </p>
                <p>
                  <strong>Amount:</strong> 
                  {input.amount
                    .filter(a => a.unit === 'lovelace')
                    .map(a => convertLovelaceToAda(a.quantity))
                    .join(', ')}
                </p>
                <p>
                  <strong>Tx Hash:</strong> 
                  <button 
                    className="btn btn-xs btn-primary ml-2" 
                    onClick={() => copyToClipboard(input.tx_hash)}
                  >
                    Copy
                  </button>
                  <span className="line-clamp-3 ml-2">{input.tx_hash}</span>
                </p>
                <p><strong>Output Index:</strong> {input.output_index}</p>
                <p><strong>Collateral:</strong> {input.collateral ? 'Yes' : 'No'}</p>
                <p><strong>Reference:</strong> {input.reference ? 'Yes' : 'No'}</p>
              </div>
            </div>
          ))}
          <h2 className="text-xl font-bold mb-2 mt-4">Outputs</h2>
          {data.utxos.outputs.map((output, index) => (
            <div key={index} className="card bg-base-300 shadow-xl mb-4">
              <div className="card-body">
                <h3 className="card-title">Output {index + 1}</h3>
                <p className="line-clamp-3" style={{ color: getColorForAddress(output.address) }}>
                  <strong>Address:</strong> 
                  <button 
                    className="btn btn-xs btn-primary ml-2" 
                    onClick={() => copyToClipboard(output.address)}
                  >
                    Copy
                  </button>
                  <span className="ml-2">{output.address}</span>
                </p>
                <p>
                  <strong>Amount:</strong> 
                  {output.amount
                    .filter(a => a.unit === 'lovelace')
                    .map(a => convertLovelaceToAda(a.quantity))
                    .join(', ')}
                </p>
                <p><strong>Output Index:</strong> {output.output_index}</p>
                <p><strong>Collateral:</strong> {output.collateral ? 'Yes' : 'No'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <pre className="p-4 rounded-lg overflow-auto bg-base-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default TransactionPage;