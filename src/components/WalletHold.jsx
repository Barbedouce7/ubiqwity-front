import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { TokenContext } from '../utils/TokenContext';
import CopyButton from '../components/CopyButton';
import { shortener } from '../utils/utils';

const Spinner = () => (
  <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>
);

const HoldingsComponent = ({ holdingsData }) => {
  const [processedHoldings, setProcessedHoldings] = useState([]);
  const [adaBalance, setAdaBalance] = useState("0");
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);

  const formatQuantity = useCallback((quantity, decimals) => {
    if (!quantity) return "0";
    return decimals ? 
      (Number(quantity) / Math.pow(10, decimals)).toFixed(decimals) : 
      quantity.toString();
  }, []);

  const checkImage = useCallback(async (token) => {
    if (!token?.unit || !token.hasLogo) return null;
    try {
      const imageUrl = `/tokenimages/${token.unit}.png`;
      const response = await fetch(imageUrl, { method: "HEAD" });
      return response.ok ? imageUrl : null;
    } catch (error) {
      console.warn(`Image not found for token: ${token.unit}`);
      return null;
    }
  }, []);

  // Phase 1: Load token data and images
  useEffect(() => {
    let isMounted = true;

    const processHoldings = async () => {
      if (!holdingsData?.holdings || !Array.isArray(holdingsData.holdings)) {
        console.warn('No holdings data available or invalid format');
        setIsLoadingTokens(false);
        return;
      }

      // Process ADA balance
      const adaHolding = holdingsData.holdings.find(h => h.unit === "lovelace");
      if (adaHolding) {
        setAdaBalance(formatQuantity(adaHolding.quantity, 6));
      }

      // Merge quantities for duplicate tokens
      const mergedHoldings = holdingsData.holdings.reduce((acc, holding) => {
        if (holding.unit === "lovelace") return acc;
        
        if (!acc[holding.unit]) {
          acc[holding.unit] = { ...holding, quantity: BigInt(holding.quantity) };
        } else {
          acc[holding.unit].quantity += BigInt(holding.quantity);
        }
        return acc;
      }, {});

      const processToken = async (holding) => {
        try {
          const metadata = tokenMetadata[holding.unit] || await fetchTokenData(holding.unit);
          if (!metadata) return null;

          // Check if token has logo in metadata
          const hasLogo = metadata.logo === 1;
          
          // If token has logo, try to load it
          const logoUrl = hasLogo ? await checkImage({
            unit: holding.unit,
            hasLogo: true
          }) : null;

          return {
            ticker: metadata?.ticker,
            unit: holding.unit,
            quantity: Number(holding.quantity),
            decimals: metadata?.decimals || holding.decimals || 0,
            name: metadata?.name,
            logo: logoUrl,
            hasMetadata: !!metadata
          };
        } catch (error) {
          console.error(`Error processing token ${holding.unit}:`, error);
          return null;
        }
      };

      const BATCH_SIZE = 5;
      const holdings = Object.values(mergedHoldings);
      const processedTokens = [];

      for (let i = 0; i < holdings.length; i += BATCH_SIZE) {
        const batch = holdings.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map(processToken));
        const validResults = batchResults.filter(Boolean);
        
        if (isMounted) {
          processedTokens.push(...validResults);
          setProcessedHoldings([...processedTokens]);
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setIsLoadingTokens(false);
    };

    processHoldings();
    return () => { isMounted = false; };
  }, [holdingsData, tokenMetadata, fetchTokenData, formatQuantity, checkImage]);

  const sortedHoldings = useMemo(() => {
    return [...processedHoldings].sort((a, b) => {
      // First sort by metadata presence
      if (a.hasMetadata !== b.hasMetadata) {
        return b.hasMetadata ? 1 : -1;
      }
      // Then by logo presence
      return (b.logo ? 1 : 0) - (a.logo ? 1 : 0);
    });
  }, [processedHoldings]);

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
                className="h-24 w-24 object-cover rounded-full"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </figure>
          )}
          <p className="text-lg font-semibold">
            <strong>{formatQuantity(holding.quantity, holding.decimals)}</strong>{' '}
            {holding.ticker && holding.ticker !== "null" ? holding.ticker : holding.name} 
            <div className="flex items-center space-x-2">
            <p className="text-xs opacity-60 break-all max-w-[180px]">{shortener(holding.unit)} <CopyButton text={holding.unit} /></p>
            
          </div>
          </p>
        </div>
      </div>
    );
  };

  if (isLoadingTokens) {
    return <Spinner />;
  }

  return (
    <div className="holdings">
      <div className="text-center mb-6">
        <p className="text-lg font-semibold">
          {processedHoldings.length} Native Tokens
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedHoldings.map(holding => (
          <TokenCard key={holding.unit} holding={holding} />
        ))}
      </div>
    </div>
  );
};

export default HoldingsComponent;