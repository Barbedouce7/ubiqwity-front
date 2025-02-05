import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { shortener } from '../utils/utils';

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

        for (let holding of holdingsResponse.data.holdings) {
          if (holding.unit === 'lovelace') continue; // On ignore ADA ici

          let updatedHolding = {
            unit: holding.unit,
            quantity: parseInt(holding.quantity),
            decimals: holding.decimals,
            metadata: null,
          };

          try {
            const metadataResponse = await axios.get(`${API_CONFIG.baseUrl}tokenmetadata/${holding.unit}`);
            updatedHolding.metadata = metadataResponse.data;
          } catch (error) {
            console.warn(`Could not fetch metadata for ${holding.unit}`, error);
          }

          // Mise à jour progressive avec tri : ceux qui ont une image en premier
          setHoldings(prevHoldings =>
            [...prevHoldings, updatedHolding].sort((a, b) => (b.metadata?.logo ? 1 : 0) - (a.metadata?.logo ? 1 : 0))
          );
        }
      } catch (error) {
        console.error('Error fetching holdings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHoldings();
  }, [walletAddress]);

  const formatQuantity = (quantity, decimals) => {
    if (decimals === null || quantity === null) return quantity; // Si decimals est null, on affiche la quantity sans modification
    const number = parseInt(quantity, 10);
    return (number / Math.pow(10, decimals)).toFixed(decimals);
  };

  if (isLoading && holdings.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500 mt-10"></div>
      </div>
    );
  }

  return (
    <div className="holdings">
    <div className="card shadow-xl mb-10 max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold mb-4 text-center">{adaBalance} <img src="tokens/ada.png" alt="ADA" className="iconCurrency inline-block mr-2 rounded-full w-10 h-10" /></h2>
    </div>

      {/* Holdings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {holdings.map((holding, index) => {
          const name = holding.metadata?.name?.value || shortener(holding.unit);
          const url = holding.metadata?.url?.value;
          const ticker = holding.metadata?.ticker?.value || "";

          return (
            <div key={index} className="card text-base-content bg-base-100 text-white shadow-2xl rounded-lg overflow-hidden">
              <div className="card-body p-4 flex flex-col items-center text-center">
                {holding.metadata?.logo?.value && (
                  <figure className="mb-2">
                    <img
                      src={`data:image/png;base64,${holding.metadata.logo.value}`}
                      alt="Token Logo"
                      className="h-32 w-32 object-cover rounded-full"
                    />
                  </figure>
                )}
                <p className="text-lg font-semibold">
                  <strong>{formatQuantity(holding.quantity, holding.decimals)}</strong> {ticker}
                </p>
                <p className="text-sm text-gray-400">
                  {/* Affichage conditionnel du nom ou de l'identifiant */}
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sky-500">{name}</a>
                  ) : (
                    <span>{name}</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HoldingsComponent;
