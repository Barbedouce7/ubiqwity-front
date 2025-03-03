import React, { useState, useEffect, useContext } from 'react';
import { TokenContext } from '../utils/TokenContext';
import CopyButton from '../components/CopyButton';
import { shortener } from '../utils/utils';
import { InformationCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { API_CONFIG } from '../utils/apiConfig';
import { Link } from 'react-router-dom';

// Composant de pagination
const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex justify-center items-center gap-2 mt-4">
    <button
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}
      className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors"
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </button>
    <span className="text-sm font-medium">
      {currentPage} / {totalPages}
    </span>
    <button
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}
      className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors"
    >
      <ChevronRightIcon className="h-5 w-5" />
    </button>
  </div>
);

const HoldingsComponent = ({ holdingsData }) => {
  const ITEMS_PER_PAGE = 20;
  const [tokens, setTokens] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);
  const [showNFTs, setShowNFTs] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [activeNFTDetails, setActiveNFTDetails] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
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
  
  const fetchAssetsBatch = async (units) => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(units),
      });
      return response.ok ? await response.json() : {};
    } catch (error) {
      console.error('Error fetching assets batch:', error);
      return {};
    }
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

      setIsInitialLoading(true);
      const mergedTokens = holdingsData.holdings.reduce((acc, holding) => {
        if (holding.unit === "lovelace") return acc;
        const quantity = BigInt(holding.quantity);
        acc[holding.unit] = acc[holding.unit] || { ...holding, quantity: 0n };
        acc[holding.unit].quantity += quantity;
        return acc;
      }, {});

      const initialTokens = Object.values(mergedTokens).map(holding => {
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
      });

      setTokens(initialTokens);
      setIsInitialLoading(false);
      setIsAssetsLoading(true);

      // Charger les métadonnées uniquement pour les éléments visibles
      const loadMetadataForPage = async () => {
        const displayTokens = showNFTs ? initialTokens.filter(t => t.isNFT) : initialTokens.filter(t => !t.isNFT);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, displayTokens.length);
        const unitsToFetch = displayTokens.slice(startIndex, endIndex).map(t => t.unit);

        const assetsData = await fetchAssetsBatch(unitsToFetch);

        const processedTokens = await Promise.all(
          initialTokens.map(async token => {
            if (!unitsToFetch.includes(token.unit)) return token;
            
            const metadata = tokenMetadata[token.unit] || await fetchTokenData(token.unit);
            const assetData = assetsData[token.unit] || {};
            
            let logoUrl = null;
            let imageUrl = null;

            if (metadata?.logo === 1) {
              const imgUrl = `/tokenimages/${token.unit}.png`;
              try {
                const response = await fetch(imgUrl, { method: 'HEAD' });
                if (response.ok) logoUrl = imgUrl;
              } catch (_) {}
            }

            if (token.isNFT && (token.onchainMetadata?.image || assetData.onchain_metadata?.image)) {
              const imageSource = token.onchainMetadata?.image || assetData.onchain_metadata?.image;
              if (imageSource?.startsWith('ipfs://')) {
                imageUrl = await loadIPFSImage(imageSource);
              }
            }

            return {
              ...token,
              decimals: metadata?.decimals || assetData.decimals || 0,
              name: metadata?.name || assetData.name,
              ticker: metadata?.ticker || assetData.ticker,
              logo: logoUrl,
              hasMetadata: !!metadata || !!Object.keys(assetData).length,
              onchainMetadata: token.onchainMetadata || assetData.onchain_metadata || metadata?.onchain_metadata,
              imageUrl,
              isLoadingMetadata: false
            };
          })
        );

        setTokens(processedTokens.sort((a, b) => {
          if (a.isNFT && b.isNFT) return (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0);
          if (a.hasMetadata !== b.hasMetadata) return b.hasMetadata ? 1 : -1;
          return (b.logo ? 1 : 0) - (a.logo ? 1 : 0);
        }));
        setIsAssetsLoading(false);
      };

      loadMetadataForPage();
    };

    setIsDataReady(false);
    processHoldings();
  }, [holdingsData, showNFTs, currentPage, tokenMetadata, fetchTokenData]);

  const displayTokens = showNFTs ? nftTokens : fungibleTokens;
  const totalItems = displayTokens.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTokens = displayTokens.slice(startIndex, startIndex + ITEMS_PER_PAGE);
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
                  onChange={(e) => {
                    setShowNFTs(e.target.checked);
                    setCurrentPage(1);
                  }}
                />
                <span className={showNFTs ? "font-bold" : "opacity-50"}>NFTs</span>
              </div>
            )}
            <h2 className="text-lg font-semibold">
              {totalItems} {showNFTs ? 'NFTs' : 'Native Tokens'}
            </h2>
          </div>

          {/* Affichage conditionnel basé sur le type de tokens (NFT vs FT) */}
          {showNFTs ? (
            <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayTokens.map(token => (
                <div 
                  key={token.unit} 
                  className="card bg-base-100 shadow-xl cursor-pointer relative"
                  onClick={() => !token.isLoadingMetadata && setActiveNFTDetails(activeNFTDetails === token.unit ? null : token.unit)}
                >
                  <div className="card-body items-center text-center space-y-4">
                    {!isDataReady || token.isLoadingMetadata ? (
                      <div className="flex justify-center items-center h-24">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
                      </div>
                    ) : token.imageUrl || token.logo ? (
                      <div className="w-24 h-24 overflow-hidden">
                        <img
                          src={token.imageUrl || token.logo}
                          alt={getDisplayName(token)}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl">
                        <span className="text-sm opacity-50">No image</span>
                      </div>
                    )}
                    
                    <div>
                      <p className="font-semibold">
                        {getDisplayName(token)}
                        {(!isDataReady || token.isLoadingMetadata) && (
                          <span className="ml-2 inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Overlay pleine écran pour les détails NFT */}
                  {activeNFTDetails === token.unit && token.onchainMetadata && (
                    <div 
                      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                      onClick={() => setActiveNFTDetails(null)}
                    >
                      <div 
                        className="bg-base-100 rounded-xl shadow-2xl max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          className="btn btn-circle btn-sm absolute top-2 right-2"
                          onClick={() => setActiveNFTDetails(null)}
                        >
                          ✕
                        </button>

                        <div className="space-y-6">
                          {/* Header avec image */}
                          <div className="flex flex-col items-center gap-4">
                            {token.imageUrl && (
                              <div className="w-32 h-32 overflow-hidden rounded-lg">
                                <img
                                  src={token.imageUrl}
                                  alt={getDisplayName(token)}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            )}
                            <h3 className="text-2xl font-bold text-center">
                              {getDisplayName(token)}
                            </h3>
                          </div>

                          {/* Détails */}
                          <div className="space-y-3">
                            {Object.entries(token.onchainMetadata).map(([key, value]) => (
                              <div 
                                key={key} 
                                className="flex flex-col sm:flex-row sm:items-start gap-2 border-b border-gray-200 pb-2"
                              >
                                <span className="font-semibold capitalize whitespace-nowrap">
                                  {key}:
                                </span>
                                <span className="break-words text-sm truncate">
                                  {typeof value === 'object' ? JSON.stringify(value) : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          ) : (
            <div>
            <div className="overflow-x-auto p-4 max-w-lg mx-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Asset | Ticker</th>
                    <th className="text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTokens.map((token) => (
                    <tr key={token.unit} className="hover border-t border-gray-500/30">
                      <td className="flex items-center gap-4 p-2">
                        <div className="relative">
                          {!isDataReady || token.isLoadingMetadata ? (
                            <div className="w-10 h-10 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
                            </div>
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full overflow-hidden cursor-pointer shadow-sm shadow-white"
                              onClick={() => setActiveTooltip(activeTooltip === token.unit ? null : token.unit)}
                            >
                              {(token.logo || token.imageUrl) && (
                                <img
                                  src={token.logo || token.imageUrl}
                                  alt=""
                                  className="w-10 h-10 object-cover"
                                  loading="lazy"
                                />
                              )}
                            </div>
                          )}
                          {activeTooltip === token.unit && (
                            <div className="card bg-base-100 shadow-xl absolute z-10 left-0 mt-2 p-4 min-w-[400px] border border-sky-500/50 rounded">
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
                                    <CopyButton text={token.assetName} className="ml-1" />
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <Link 
                          to={`/asset/${token.unit}`} 
                          className="font-semibold hover:text-primary"
                        >
                          {getDisplayName(token)}
                          {(!isDataReady || token.isLoadingMetadata) && (
                            <span className="ml-2 inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-sky-500"></span>
                          )}
                        </Link>
                      </td>
                      <td className="text-right font-mono">
                        {formatQuantity(token.quantity, token.decimals)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HoldingsComponent;