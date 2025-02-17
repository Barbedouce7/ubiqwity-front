import React, { useState, useEffect, useContext } from 'react';
import { TokenContext } from '../utils/TokenContext';
import CopyButton from '../components/CopyButton';
import { shortener } from '../utils/utils';

const HoldingsComponent = ({ holdingsData }) => {
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);

  const formatQuantity = (quantity, decimals = 0) => {
    if (!quantity) return "0";
    return decimals ? 
      (Number(quantity) / Math.pow(10, decimals)).toFixed(decimals) : 
      quantity.toString();
  };

  const splitPolicyAndAsset = (unit) => {
    const policyId = unit.slice(0, 56);
    const assetNameHex = unit.slice(56);
    let assetName = '';
    
    try {
      for (let i = 0; i < assetNameHex.length; i += 2) {
        const hexPair = assetNameHex.substr(i, 2);
        const charCode = parseInt(hexPair, 16);
        if (charCode >= 32 && charCode <= 126) {
          assetName += String.fromCharCode(charCode);
        } else {
          assetName += `[${hexPair}]`;
        }
      }
    } catch (error) {
      console.warn('Error converting hex to text:', error);
      assetName = assetNameHex;
    }

    return { policyId, assetName };
  };

  const getDisplayName = (token) => {
    if (token.hasMetadata) {
      if (token.ticker && token.ticker !== "null") return token.ticker;
      if (token.name && token.name !== "null") return token.name;
    }
    return token.assetName || '???';
  };

  useEffect(() => {
    const processHoldings = async () => {
      if (!holdingsData?.holdings?.length) {
        setIsLoading(false);
        return;
      }

      const mergedTokens = holdingsData.holdings.reduce((acc, holding) => {
        if (holding.unit === "lovelace") return acc;
        
        const quantity = BigInt(holding.quantity);
        if (acc[holding.unit]) {
          acc[holding.unit].quantity += quantity;
        } else {
          acc[holding.unit] = { ...holding, quantity };
        }
        return acc;
      }, {});

      const processedTokens = await Promise.all(
        Object.values(mergedTokens).map(async (holding) => {
          try {
            const metadata = tokenMetadata[holding.unit] || await fetchTokenData(holding.unit);
            const { policyId, assetName } = splitPolicyAndAsset(holding.unit);

            let logoUrl = null;
            if (metadata?.logo === 1) {
              const imgUrl = `/tokenimages/${holding.unit}.png`;
              try {
                const response = await fetch(imgUrl, { method: 'HEAD' });
                if (response.ok) logoUrl = imgUrl;
              } catch (error) {
                console.warn(`Failed to load image for ${holding.unit}`);
              }
            }

            return {
              unit: holding.unit,
              quantity: Number(holding.quantity),
              decimals: metadata?.decimals || 0,
              name: metadata?.name,
              ticker: metadata?.ticker,
              logo: logoUrl,
              policyId,
              assetName,
              hasMetadata: !!metadata
            };
          } catch (error) {
            console.error(`Error processing token ${holding.unit}:`, error);
            const { policyId, assetName } = splitPolicyAndAsset(holding.unit);
            return {
              unit: holding.unit,
              quantity: Number(holding.quantity),
              decimals: 0,
              policyId,
              assetName,
              hasMetadata: false
            };
          }
        })
      );

      const validTokens = processedTokens.filter(Boolean).sort((a, b) => {
        if (a.hasMetadata !== b.hasMetadata) return b.hasMetadata ? 1 : -1;
        return (b.logo ? 1 : 0) - (a.logo ? 1 : 0);
      });

      setTokens(validTokens);
      setIsLoading(false);
    };

    processHoldings();
  }, [holdingsData, tokenMetadata, fetchTokenData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-center">
        {tokens.length} Native Tokens
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokens.map(token => (
          <div key={token.unit} className="bg-base-100 rounded-lg shadow-xl p-4">
            <div className="flex flex-col items-center space-y-3">
              {token.logo ? (
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={token.logo}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200" />
              )}
              
              <div className="text-center">
                <p className="font-semibold">
                  {formatQuantity(token.quantity, token.decimals)}{' '}
                  {getDisplayName(token)}
                </p>
                <div className="flex flex-col items-center text-xs text-gray-500 mt-1">
                  {!token.hasMetadata && (
                    <span className="text-xs opacity-50 font-mono break-all mb-1">
                      {shortener(token.policyId)}
                      <CopyButton text={token.policyId} className="ml-1" />
                    </span>
                  )}
                  <div className="flex items-center">
                    <span className="truncate max-w-[120px]">
                      {token.hasMetadata ? shortener(token.unit) : shortener(token.assetName)}
                    </span>
                    <CopyButton text={token.unit} className="ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoldingsComponent;