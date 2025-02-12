import React, { useState, useEffect, useContext, useCallback } from 'react';
import { TokenContext } from '../utils/TokenContext';

const HoldingsComponent = ({ holdingsData }) => {
  const [holdings, setHoldings] = useState([]);
  const [displayedHoldings, setDisplayedHoldings] = useState([]);
  const [adaBalance, setAdaBalance] = useState("0");
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);

  // Format quantity with proper decimal places
  const formatQuantity = useCallback((quantity, decimals) => {
    if (!quantity) return "0";
    return decimals ? (quantity / Math.pow(10, decimals)).toFixed(decimals) : quantity.toString();
  }, []);

  // Check image existence and update token data
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

  // Process holdings data
  useEffect(() => {
    const processHoldings = async () => {
      if (!holdingsData?.holdings || !Array.isArray(holdingsData.holdings)) {
        console.warn('No holdings data available or invalid format');
        return;
      }

      // Process holdings in smaller batches to prevent UI freezing
      const BATCH_SIZE = 5;
      let processedHoldings = [];

      for (let i = 0; i < holdingsData.holdings.length; i += BATCH_SIZE) {
        const batch = holdingsData.holdings.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async (holding) => {
          // Handle ADA separately
          if (holding.unit === "lovelace") {
            setAdaBalance(formatQuantity(holding.quantity, 6));
            return null;
          }

          try {
            // Safely access token metadata
            const metadata = tokenMetadata[holding.unit] || await fetchTokenData(holding.unit);
            if (!metadata) return null;

            const tokenData = {
              unit: holding.unit,
              quantity: parseInt(holding.quantity) || 0,
              decimals: metadata?.decimals || holding.decimals || 0,
              name: metadata?.ticker || metadata?.name || "Unknown Token",
              logo: null
            };

            // Check for token image
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
        processedHoldings = [...processedHoldings, ...validResults];

        // Update state with each batch
        setDisplayedHoldings(prev => {
          const newHoldings = [...prev, ...validResults];
          return newHoldings.sort((a, b) => (b.logo ? 1 : 0) - (a.logo ? 1 : 0));
        });

        // Small delay between batches to prevent UI freezing
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setHoldings(processedHoldings);
    };

    processHoldings();
  }, [holdingsData, tokenMetadata, fetchTokenData, checkImage, formatQuantity]);

  // Render token card
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
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </figure>
          )}
          <p className="text-lg font-semibold">
            <strong>{formatQuantity(holding.quantity, holding.decimals)}</strong>{' '}
            {holding.name}
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
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedHoldings.map((holding, index) => (
          <TokenCard key={`${holding.unit}-${index}`} holding={holding} />
        ))}
      </div>
    </div>
  );
};

export default HoldingsComponent;