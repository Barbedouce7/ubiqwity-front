import React, { useState, useEffect, useContext } from 'react';
import { TokenContext } from '../utils/TokenContext';
import CopyButton from '../components/CopyButton';
import { shortener } from '../utils/utils';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const HoldingsComponent = ({ holdingsData }) => {
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNFTs, setShowNFTs] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
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
      let i = 0;
      while (i < assetNameHex.length) {
        if (i + 1 >= assetNameHex.length) break;
        
        const hexPair = assetNameHex.substr(i, 2);
        const charCode = parseInt(hexPair, 16);
        
        const isValidHex = (hex) => /^[0-9A-Fa-f]+$/.test(hex);
        
        if (!isValidHex(hexPair)) {
          i += 2;
          continue;
        }

        if (charCode >= 32 && charCode <= 126) {
          assetName += String.fromCharCode(charCode);
          i += 2;
          continue;
        }

        if (i + 8 <= assetNameHex.length && 
            assetNameHex.substr(i, 4) === 'f09f') {
          const emojiHex = assetNameHex.substr(i, 8);
          if (isValidHex(emojiHex)) {
            const emojiBytes = new Uint8Array(4);
            for (let j = 0; j < 8; j += 2) {
              emojiBytes[j/2] = parseInt(emojiHex.substr(j, 2), 16);
            }
            try {
              const emojiChar = new TextDecoder('utf-8').decode(emojiBytes);
              if (emojiChar && emojiChar.length === 1) {
                assetName += emojiChar;
                i += 8;
                continue;
              }
            } catch (e) {}
          }
        }

        if (charCode === 0) {
          i += 2;
          continue;
        }
        if (charCode === 0x0d || charCode === 0x0a) {
          assetName += ' ';
          i += 2;
          continue;
        }

        if (charCode > 0x7f) {
          let bytesCount = 0;
          if ((charCode & 0xE0) === 0xC0) bytesCount = 2;
          else if ((charCode & 0xF0) === 0xE0) bytesCount = 3;
          else if ((charCode & 0xF8) === 0xF0) bytesCount = 4;

          if (bytesCount > 0 && i + (bytesCount * 2) <= assetNameHex.length) {
            const utfHex = assetNameHex.substr(i, bytesCount * 2);
            if (isValidHex(utfHex)) {
              const utfBytes = new Uint8Array(bytesCount);
              for (let j = 0; j < bytesCount * 2; j += 2) {
                utfBytes[j/2] = parseInt(utfHex.substr(j, 2), 16);
              }
              try {
                const char = new TextDecoder('utf-8').decode(utfBytes);
                if (char && !char.includes('�')) {
                  assetName += char;
                  i += bytesCount * 2;
                  continue;
                }
              } catch (e) {}
            }
          }
        }

        assetName += '_';
        i += 2;
      }

      assetName = assetName
        .replace(/_{2,}/g, '_')
        .replace(/^\s+|\s+$/g, '');

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
              hasMetadata: !!metadata,
              isNFT: Number(holding.quantity) === 1
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
              hasMetadata: false,
              isNFT: Number(holding.quantity) === 1
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

  const filteredTokens = tokens.filter(token => token.isNFT === showNFTs);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="loading loading-spinner loading-md text-primary"></div>
      </div>
    );
  }

return (
    <div className="space-y-6">
      {filteredTokens.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg font-semibold">No CNT ( FT/NFT ) for this wallet</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-4">
              <span className={!showNFTs ? "font-bold" : "opacity-50"}>Tokens</span>
              <input 
                type="checkbox" 
                className="toggle toggle-primary toggle-lg" 
                checked={showNFTs}
                onChange={(e) => setShowNFTs(e.target.checked)}
              />
              <span className={showNFTs ? "font-bold" : "opacity-50"}>NFTs</span>
            </div>
            <h2 className="text-lg font-semibold">
              {filteredTokens.length} {showNFTs ? 'NFTs' : 'Native Tokens'}
            </h2>
          </div>

          {showNFTs ? (
            // Affichage en grille pour les NFTs
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTokens.map(token => (
                <div key={token.unit} className="card bg-base-100 shadow-xl">
                  <div className="card-body items-center text-center space-y-3">
                    {token.logo ? (
                      <div className="w-24 h-24 rounded-full overflow-hidden">
                        <img
                          src={token.logo}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-base-200" />
                    )}
                    
                    <div>
                      <p className="font-semibold">
                        {formatQuantity(token.quantity, token.decimals)}{' '}
                        {getDisplayName(token)}
                      </p>
                      <div className="flex flex-col items-center text-xs opacity-70 mt-1">
                        {!token.hasMetadata && (
                          <span className="font-mono break-all mb-1">
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
          ) : (
            // Affichage en tableau pour les tokens normaux
            <div className="overflow-x-auto p-4 max-w-lg mx-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Asset | Ticker</th>
                    <th className="text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTokens.map((token) => (
                    <tr key={token.unit} className="hover border-t border-gray-500/30">
                      <td className="flex items-center gap-4 p-2 ">
                        <div className="relative">
                          <div 
                            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer shadow-sm shadow-white"
                            onClick={() => setActiveTooltip(activeTooltip === token.unit ? null : token.unit)}
                          >
                            {token.logo && (
                              <img
                                src={token.logo}
                                alt=""
                                className="w-10 h-10 object-cover"
                                loading="lazy"
                              />
                            )}
                          </div>
                          {activeTooltip === token.unit && (
                            <div className="card bg-base-100 shadow-xl absolute z-10 left-0 mt-2 p-4 min-w-[400px]  border border-sky-500/50 rounded ">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">Policy ID:</span>
                                  <span className="font-mono text-xs">
                                    {shortener(token.policyId)}
                                    <CopyButton text={token.policyId} className="ml-1" />
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">Asset Name:</span>
                                  <span className="font-mono text-xs">
                                    {shortener(token.assetName)}
                                    <CopyButton text={token.assetNamet} className="ml-1" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className="font-semibold">{getDisplayName(token)}</span>
                      </td>
                      <td className="text-right font-mono">
                        {formatQuantity(token.quantity, token.decimals)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HoldingsComponent;