import React, { useState, useEffect, useContext, useCallback } from 'react';
import { TokenContext } from '../utils/TokenContext';
import CopyButton from '../components/CopyButton';

const HoldingsComponent = ({ holdingsData }) => {
  const [holdings, setHoldings] = useState([]);
  const [displayedHoldings, setDisplayedHoldings] = useState([]);
  const [adaBalance, setAdaBalance] = useState("0");
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);

  const formatQuantity = useCallback((quantity, decimals) => {
    if (!quantity) return "0";
    return decimals ? (quantity / Math.pow(10, decimals)).toFixed(decimals) : quantity.toString();
  }, []);

  const checkImage = useCallback(async (token) => {
    if (!token?.unit) return null;
    
    const imageUrl = `/tokenimages/${token.unit}.png`;
    try {
      const response = await fetch(imageUrl, { method: "HEAD" });
      if (response.ok) {
        return imageUrl;
      }
    } catch (error) {
      console.warn(`Image not found for token: ${token.unit}`);
    }
    return null;
  }, []);

  useEffect(() => {
    const processHoldings = async () => {
      // Réinitialiser les états pour éviter les doublons
      setHoldings([]);
      setDisplayedHoldings([]);

      if (!holdingsData?.holdings || !Array.isArray(holdingsData.holdings)) {
        console.warn('No holdings data available or invalid format');
        return;
      }

      const mergedHoldings = holdingsData.holdings.reduce((acc, holding) => {
        if (holding.unit === "lovelace") {
          setAdaBalance(formatQuantity(holding.quantity, 6));
          return acc;
        }

        if (!acc[holding.unit]) {
          acc[holding.unit] = { ...holding, quantity: BigInt(holding.quantity) };
        } else {
          acc[holding.unit].quantity += BigInt(holding.quantity);
        }
        return acc;
      }, {});

      const BATCH_SIZE = 5;
      const mergedHoldingsArray = Object.values(mergedHoldings);

      for (let i = 0; i < mergedHoldingsArray.length; i += BATCH_SIZE) {
        const batch = mergedHoldingsArray.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (holding) => {
          try {
            const metadata = tokenMetadata[holding.unit] || await fetchTokenData(holding.unit);
            if (!metadata) return null;

            const tokenData = {
              unit: holding.unit,
              quantity: Number(holding.quantity),
              decimals: metadata?.decimals || holding.decimals || 0,
              name: metadata?.ticker || metadata?.name || "Unknown Token",
              logo: null
            };

            const logo = await checkImage(tokenData);
            if (logo) {
              tokenData.logo = logo;
            }

            return tokenData;
          } catch (error) {
            console.error(`Error processing token ${holding.unit}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter(result => result !== null);
        
        setDisplayedHoldings(prev => 
          [...prev, ...validResults].sort((a, b) => (b.logo ? 1 : 0) - (a.logo ? 1 : 0))
        );

        // Ajouter les résultats valides à l'état final
        setHoldings(prev => [...prev, ...validResults]);

        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };

    processHoldings();
  }, [holdingsData, tokenMetadata, fetchTokenData, checkImage, formatQuantity]);

  const TokenCard = ({ holding }) => {
    if (!holding) return null;

    return (
      <div className="card text-base-content bg-base-100 text-white shadow-2xl rounded-lg overflow-hidden">
        <div className="card-body p-4 flex flex-col items-center text-center">
          {holding.logo && (
            <figure className="mb-2">
              <img 
                src={holding.logo} 
                alt={`${holding.name} Logo`} 
                className="h-32 w-32 object-cover rounded-full"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </figure>
          )}
          <p className="text-lg font-semibold">
            <strong>{formatQuantity(holding.quantity, holding.decimals)}</strong>{' '}
            {holding.name} <CopyButton text={holding.unit} />
          </p>
          <p className="text-sm text-gray-400">{holding.name}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="holdings">
      <div className="card shadow-xl mb-10 max-w-lg mx-auto p-4">
        <h2 className="text-xl font-bold mb-4 text-center">
          {adaBalance}{' '}
          <img 
            src="/assets/cardano.webp" 
            alt="ADA" 
            className="iconCurrency inline-block mr-2 rounded-full w-10 h-10"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedHoldings.map(holding => (
          <TokenCard key={holding.unit} holding={holding} />
        ))}
      </div>
    </div>
  );
};

export default HoldingsComponent;