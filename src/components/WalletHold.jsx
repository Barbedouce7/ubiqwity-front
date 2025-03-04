// HoldingsContainer.jsx
import React, { useState, useEffect, useContext } from 'react';
import { TokenContext } from '../utils/TokenContext';
import TokenList from './TokenList';
import NFTGallery from './NFTGallery';
import { API_CONFIG } from '../utils/apiConfig';

const HoldingsContainer = ({ holdingsData }) => {
  const [tokens, setTokens] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);
  const [showNFTs, setShowNFTs] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [activeNFTDetails, setActiveNFTDetails] = useState(null);
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);
  const [nftTokens, setNftTokens] = useState([]);
  const [fungibleTokens, setFungibleTokens] = useState([]);
  const [isDataReady, setIsDataReady] = useState(false);

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

  const loadIPFSImage = async (ipfsUrl) => {
    if (!ipfsUrl) return null;
    const cid = ipfsUrl.replace('ipfs://', '');
    const gateways = [
      `https://ipfs.io/ipfs/${cid}`,
      `https://dweb.link/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`
    ];

    for (const gatewayUrl of gateways) {
      try {
        const response = await fetch(gatewayUrl, { method: 'HEAD' });
        if (response.ok) return gatewayUrl;
      } catch (err) {
        console.warn(`Failed to load image from ${gatewayUrl}:`, err);
      }
    }
    return gateways[0];
  };

  const getDisplayName = (token) => {
    if (token.onchainMetadata?.name) return token.onchainMetadata.name;
    if (token.hasMetadata) {
      if (token.ticker && token.ticker !== "null") return token.ticker;
      if (token.name && token.name !== "null") return token.name;
    }
    return token.assetName || '???';
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchAssetsBatch = async (units, batchSize = 10) => {
    let assetsData = {};
    
    for (let i = 0; i < units.length; i += batchSize) {
      const batchUnits = units.slice(i, i + batchSize);
      try {
        const response = await fetch(`${API_CONFIG.baseUrl}assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchUnits),
        });

        if (response.ok) {
          const batchData = await response.json();
          assetsData = { ...assetsData, ...batchData };
          
          setTokens(prevTokens => {
            const updatedTokens = [...prevTokens];
            for (const unit of batchUnits) {
              const tokenIndex = updatedTokens.findIndex(t => t.unit === unit);
              if (tokenIndex !== -1 && batchData[unit]) {
                const token = updatedTokens[tokenIndex];
                const assetData = batchData[unit];
                
                updatedTokens[tokenIndex] = {
                  ...token,
                  decimals: token.decimals || assetData.decimals || 0,
                  name: token.name || assetData.name,
                  ticker: token.ticker || assetData.ticker,
                  hasMetadata: token.hasMetadata || !!Object.keys(assetData).length,
                  onchainMetadata: token.onchainMetadata || assetData.onchain_metadata,
                  isLoadingMetadata: false
                };
              }
            }
            return updatedTokens;
          });
        }
        
        await delay(100);
        
      } catch (error) {
        console.error(`Error fetching batch assets data (${i}-${i+batchSize}):`, error);
      }
    }
    
    return assetsData;
  };

  useEffect(() => {
    if (tokens.length > 0) {
      setNftTokens(tokens.filter(token => token.isNFT));
      setFungibleTokens(tokens.filter(token => !token.isNFT));
      const allTokensReady = !tokens.some(token => token.isLoadingMetadata);
      if (allTokensReady) {
        setIsDataReady(true);
      }
    }
  }, [tokens]);

  useEffect(() => {
    const processHoldings = async () => {
      if (!holdingsData?.holdings?.length) {
        setTokens([]);
        setIsInitialLoading(false);
        setIsDataReady(true);
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

      const initialTokens = await Promise.all(
        Object.values(mergedTokens).map(async (holding, index) => {
          await delay(Math.min(index * 10, 500));
          const { policyId, assetName } = splitPolicyAndAsset(holding.unit);
          return {
            unit: holding.unit,
            quantity: Number(holding.quantity),
            decimals: 0,
            policyId,
            assetName,
            hasMetadata: false,
            isNFT: Number(holding.quantity) === 1,
            isLoadingMetadata: true
          };
        })
      );

      setTokens(initialTokens);
      setIsInitialLoading(false);
      setIsAssetsLoading(true);

      const units = Object.keys(mergedTokens);
      const assetsData = await fetchAssetsBatch(units, 10);

      const processedTokens = await Promise.all(
        initialTokens.map(async (token, index) => {
          await delay(Math.min(index * 10, 500));
          try {
            const metadata = tokenMetadata[token.unit] || await fetchTokenData(token.unit);
            const assetData = assetsData[token.unit] || {};
            
            let logoUrl = null;
            let imageUrl = null;

            if (metadata?.logo === 1) {
              const imgUrl = `/tokenimages/${token.unit}.png`;
              try {
                const response = await fetch(imgUrl, { method: 'HEAD' });
                if (response.ok) logoUrl = imgUrl;
              } catch (error) {}
            }

            if (token.isNFT && (token.onchainMetadata?.image || assetData.onchain_metadata?.image)) {
              const imageSource = token.onchainMetadata?.image || assetData.onchain_metadata?.image;
              if (imageSource?.startsWith('ipfs://')) {
                imageUrl = await loadIPFSImage(imageSource);
              }
            }

            return {
              ...token,
              decimals: metadata?.decimals || assetData.decimals || token.decimals || 0,
              name: metadata?.name || assetData.name || token.name,
              ticker: metadata?.ticker || assetData.ticker || token.ticker,
              logo: logoUrl,
              hasMetadata: !!metadata || !!Object.keys(assetData).length || token.hasMetadata,
              onchainMetadata: token.onchainMetadata || assetData.onchain_metadata || metadata?.onchain_metadata,
              imageUrl,
              isLoadingMetadata: false
            };
          } catch (error) {
            console.error(`Error processing token ${token.unit}:`, error);
            return {
              ...token,
              isLoadingMetadata: false
            };
          }
        })
      );

      const validTokens = processedTokens.filter(Boolean).sort((a, b) => {
        if (a.isNFT && b.isNFT) return (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0);
        if (a.hasMetadata !== b.hasMetadata) return b.hasMetadata ? 1 : -1;
        return (b.logo ? 1 : 0) - (a.logo ? 1 : 0);
      });

      setTokens(validTokens);
      setIsAssetsLoading(false);
    };

    setIsDataReady(false);
    processHoldings();
  }, [holdingsData, tokenMetadata, fetchTokenData]);

  const displayTokens = showNFTs ? nftTokens : fungibleTokens.map(token => ({
    ...token,
    displayName: getDisplayName(token) // Ajoute displayName pour TokenList
  }));
  const hasAnyTokens = nftTokens.length > 0 || fungibleTokens.length > 0;

  if (isInitialLoading) {
    return (
      <div className="flex justify-center items-center min-h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hasAnyTokens ? (
        <div className="text-center py-8">
          <p className="text-lg font-semibold">No CNT ( FT/NFT ) for this wallet</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center space-y-4">
            {hasAnyTokens && (
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
            )}
            <h2 className="text-lg font-semibold">
              {displayTokens.length} {showNFTs ? 'NFTs' : 'Native Tokens'}
            </h2>
          </div>

          {showNFTs ? (
            <NFTGallery 
              tokens={displayTokens}
              isDataReady={isDataReady}
              activeNFTDetails={activeNFTDetails}
              setActiveNFTDetails={setActiveNFTDetails}
              getDisplayName={getDisplayName}
            />
          ) : (
            <TokenList 
              tokens={displayTokens}
              isDataReady={isDataReady}
              activeTooltip={activeTooltip}
              setActiveTooltip={setActiveTooltip}
              formatQuantity={formatQuantity}
            />
          )}
        </>
      )}
    </div>
  );
};

export default HoldingsContainer;