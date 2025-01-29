import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from './apiConfig';
import { copyToClipboard, getColorForAddress, convertLovelaceToAda, deviseResolver } from './utils';

function TransactionPage() {
  const { txId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('eutxo');
  const [resolvedAmounts, setResolvedAmounts] = useState({});
  const [hoveredHash, setHoveredHash] = useState(null); // Pour afficher le hash au survol
  const [clickedHash, setClickedHash] = useState(null); // Pour afficher le hash au clic

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}tx/${txId}`);
        
        const newResolvedAmounts = {};
        const promises = [];

        // Process each input and output
        [...response.data.utxos.inputs, ...response.data.utxos.outputs].forEach((io, index) => {
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
              newResolvedAmounts[`${io === response.data.utxos.inputs[index] ? 'input' : 'output'}-${index}`] = amounts;
            })
          );
        });

        await Promise.all(promises);
        setData(response.data);
        setResolvedAmounts(newResolvedAmounts);
        setLoading(false);
      } catch (error) {
        if (error.response) {
          setError(`An error occurred while fetching data: Status ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          setError('An error occurred while fetching data: No response from server');
        } else {
          setError(`An error occurred while fetching data: ${error.message}`);
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [txId]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  if (!data) return null;

  const renderAmount = (amounts, ioType, index) => {
  return (
    <div className="flex flex-col items-center">
      {amounts.map((a, idx) => {
        const handleHover = (hash) => setHoveredHash(hash);
        const handleClick = (hash) => {
          setClickedHash(hash);
          copyToClipboard(hash);
        };

        const quantity = a.unit === 'ADA' 
          ? convertLovelaceToAda(a.quantity)
          : (a.quantity / (10 ** a.decimals)).toFixed(a.decimals);

        return (
          <div key={a.unit} className="flex items-center mb-2">
            {a.logo && 
              <button 
                className="btn btn-xs btn-circle" 
                onMouseEnter={() => handleHover(a.originalUnit)} 
                onMouseLeave={() => handleHover(null)}
                onClick={(e) => {
                  e.stopPropagation(); 
                  handleClick(a.originalUnit);
                }}
              >
                <img src={`data:image/png;base64,${a.logo}`} alt={a.unit} className="w-6 h-6" />
              </button>
            }
            <span className="ml-2 text-center">{quantity} {a.unit}</span>
          </div>
        );
      })}
      {clickedHash && 
        <div className="absolute z-50 bg-base-100 border border-gray-300 rounded p-2 shadow-lg mt-2">
          <div className="text-xs">{clickedHash} 
            <button 
              className="ml-2 btn btn-xs" 
              onClick={() => copyToClipboard(clickedHash)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  );
};

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Transaction Details</h1>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2">
            <strong>Block Hash:</strong> 
            <button 
              className="btn btn-xs ml-2" 
              onClick={() => copyToClipboard(data.block.hash)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
              </svg>
            </button>
            <span className="line-clamp-3 ml-2">{data.block.hash}</span>
          </div>
          <div className="mb-2">
            <strong>Block Number:</strong> {data.block.height}
          </div>
          <div><strong>Date:</strong> {new Date(data.block.time).toLocaleString()}</div>
        </div>
        <div>
          <div className="mb-2">
            <strong>Transaction Hash:</strong> 
            <button 
              className="btn btn-xs ml-2" 
              onClick={() => copyToClipboard(data.transaction)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
              </svg>
            </button>
            <span className="line-clamp-3 ml-2">{data.transaction}</span>
          </div>
          <div className="mb-2"><strong>Fees:</strong> {data.fees} ADA</div>
          <div className="mb-2"><strong>Size:</strong> {data.size} bytes</div>
        </div>
      </div>

      <div className="tabs mb-4">
        <a className={`tab tab-bordered ${activeTab === 'eutxo' ? 'tab-active' : ''}`} onClick={() => setActiveTab('eutxo')}>eUTXO</a> 
        <a className={`tab tab-bordered ${activeTab === 'diagram' ? 'tab-active' : ''}`} onClick={() => setActiveTab('diagram')}>Diagram</a>
        <a className={`tab tab-bordered ${activeTab === 'json' ? 'tab-active' : ''}`} onClick={() => setActiveTab('json')}>JSON</a>
      </div>

      {activeTab === 'eutxo' ? (
        <div>
          <h2 className="text-xl font-bold mb-2">Inputs</h2>
          {data.utxos.inputs.map((input, index) => (
            <div key={`input-${index}`} className="card bg-base-300 shadow-xl mb-4">
              <div className="card-body">
                <h3 className="card-title">Input {index + 1}</h3>
                <div className="line-clamp-3" style={{ color: getColorForAddress(input.address) }}>
                  <strong>Address:</strong> 
                  <button 
                    className="btn btn-xs ml-2" 
                    onClick={() => copyToClipboard(input.address)}
                  >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
              </svg>
                  </button>
                  <span className="ml-2">{input.address}</span>
                </div>
<div className="text-center">
  <strong>Amount:</strong> 

    {resolvedAmounts[`input-${index}`] ? renderAmount(resolvedAmounts[`input-${index}`], 'input', index) : 'Loading...'}

</div>
              </div>
            </div>
          ))}
          <h2 className="text-xl font-bold mb-2 mt-4">Outputs</h2>
          {data.utxos.outputs.map((output, index) => (
            <div key={`output-${index}`} className="card bg-base-300 shadow-xl mb-4">
              <div className="card-body">
                <h3 className="card-title">Output {index + 1}</h3>
                <div className="line-clamp-3" style={{ color: getColorForAddress(output.address) }}>
                  <strong>Address:</strong> 
                  <button 
                    className="btn btn-xs ml-2" 
                    onClick={() => copyToClipboard(output.address)}
                  >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
              </svg>
                  </button>
                  <span className="ml-2">{output.address}</span>
                </div>
<div className="text-center">
  <strong>Amount:</strong> 
    {resolvedAmounts[`input-${index}`] ? renderAmount(resolvedAmounts[`input-${index}`], 'input', index) : 'Loading...'}
</div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === 'diagram' ? (
        <div className="text-center text-lg font-semibold">Diagram</div>
      ) : (
        <pre className="p-4 rounded-lg overflow-auto text-left bg-gray-900 text-green-400">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default TransactionPage;