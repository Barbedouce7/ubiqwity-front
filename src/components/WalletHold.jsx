import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';

const HoldingsComponent = ({ walletAddress }) => {
  const [holdings, setHoldings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adaBalance, setAdaBalance] = useState('0');

  useEffect(() => {
    const fetchHoldings = async () => {
      setIsLoading(true);
      try {
        const holdingsResponse = await axios.get(`${API_CONFIG.baseUrl}wallet/${walletAddress}/hold`);
        setAdaBalance(formatQuantity(holdingsResponse.data.holdings.find(h => h.unit === 'lovelace')?.quantity, 6));

        // Group holdings by unit before fetching metadata
        let groupedHoldings = holdingsResponse.data.holdings.reduce((acc, holding) => {
          if (holding.unit !== 'lovelace') {
            if (!acc[holding.unit]) acc[holding.unit] = [];
            acc[holding.unit].push(holding);
          }
          return acc;
        }, {});

        const updatedHoldings = await Promise.all(Object.entries(groupedHoldings).map(async ([unit, holdings]) => {
          try {
            const metadataResponse = await axios.get(`https://tokens.cardano.org/metadata/${unit}`);
            return { 
              unit, 
              metadata: metadataResponse.data, 
              quantity: holdings.reduce((sum, h) => sum + parseInt(h.quantity), 0), 
              decimals: holdings[0].decimals 
            };
          } catch (error) {
            console.warn(`Could not fetch metadata for ${unit}`, error);
            return { 
              unit, 
              metadata: null, 
              quantity: holdings.reduce((sum, h) => sum + parseInt(h.quantity), 0), 
              decimals: holdings[0].decimals 
            };
          }
        }));

        // Sort holdings so those with logos come first
        updatedHoldings.sort((a, b) => (b.metadata?.logo ? 1 : 0) - (a.metadata?.logo ? 1 : 0));
        setHoldings(updatedHoldings);
      } catch (error) {
        console.error('Error fetching holdings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHoldings();
  }, [walletAddress]);

  const formatQuantity = (quantity, decimals) => {
    if (decimals === null) return quantity;
    const number = parseInt(quantity, 10);
    return (number / Math.pow(10, decimals)).toFixed(decimals);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500 mt-20"></div>
      </div>
    );
  }

  return (
    <div className="holdings">
      <h2 className="text-lg font-bold mb-4 text-center">Holdings</h2>
      {/* Display ADA balance separately */}
      <div className="mb-4 card text-base-content bg-base-100 text-white shadow-2xl rounded-lg overflow-hidden">
        <div className="card-body p-4">
          <div className="text-left">
            <strong>ADA Balance:</strong> {adaBalance}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {holdings.map((holding, index) => {
          const name = holding.metadata?.name?.value || holding.unit;
          return (
            <div key={index} className="card text-base-content bg-base-100 text-white shadow-2xl rounded-lg overflow-hidden">
              <div className="card-body p-4">
                {holding.metadata?.logo && 
                  <figure className="mb-2">
                    <img src={`data:image/png;base64,${holding.metadata.logo.value}`} alt="Token Logo" className="h-32 w-32 object-cover rounded-full" />
                  </figure>
                }
                <p className="text-left"><strong>{formatQuantity(holding.quantity, holding.decimals)}</strong> {name}</p>
                {holding.metadata?.ticker && 
                  <p className="text-left"><strong>Ticker:</strong> {holding.metadata.ticker.value}</p>
                }
                {holding.metadata?.url && 
                  <div className="text-left">
                    <strong>URL:</strong>
                    <a href={holding.metadata.url.value} target="_blank" rel="noopener noreferrer" className="ml-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v4" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </a>
                  </div>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HoldingsComponent;