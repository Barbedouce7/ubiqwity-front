import React, { useState, useEffect, useContext } from 'react';
import { TokenContext } from '../utils/TokenContext';
import TokenList from './TokenList';
import NFTGallery from './NFTGallery';

const HoldingsContainer = ({ holdingsData }) => {
  const [showNFTs, setShowNFTs] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [activeNFTDetails, setActiveNFTDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { processHoldings, processedHoldings } = useContext(TokenContext);

  const formatQuantity = (quantity, decimals = 0) => {
    if (!quantity) return "0";
    return decimals ? 
      (Number(quantity) / Math.pow(10, decimals)).toFixed(decimals) : 
      quantity.toString();
  };

  const getDisplayName = (token) => {
    if (token.onchainMetadata?.name) return token.onchainMetadata.name;
    if (token.hasMetadata) {
      if (token.ticker && token.ticker !== "null") return token.ticker;
      if (token.name && token.name !== "null") return token.name;
    }
    return token.assetName || '???';
  };

  useEffect(() => {
    if (!holdingsData?.holdings?.length) {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    processHoldings(holdingsData)
      .then(() => {
        setIsProcessing(false);
      })
      .catch((error) => {
        console.error('Error processing holdings:', error);
        setIsProcessing(false);
      });
  }, [holdingsData, processHoldings]);

  const tokens = processedHoldings.tokens || [];
  const nftTokens = processedHoldings.nftTokens || [];
  const fungibleTokens = processedHoldings.fungibleTokens || [];
  const hasAnyTokens = nftTokens.length > 0 || fungibleTokens.length > 0;
  const isLoadingMetadata = tokens.some(token => token.isLoadingMetadata);

  const displayTokens = showNFTs 
    ? nftTokens 
    : fungibleTokens.map(token => ({
        ...token,
        displayName: getDisplayName(token)
      }));

  return (
    <div className="space-y-6">
      {(isProcessing || (tokens.length === 0 && isLoadingMetadata)) ? (
        <div className="flex justify-center items-center min-h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
          <span className="ml-2">Loading holdings...</span>
        </div>
      ) : !hasAnyTokens ? (
        <div className="text-center py-8">
          <p className="text-lg font-semibold">No CNT (FT/NFT) for this wallet</p>
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
              {isLoadingMetadata && ' (loading metadata...)'}
            </h2>
          </div>

          {showNFTs ? (
            <NFTGallery 
              activeNFTDetails={activeNFTDetails}
              setActiveNFTDetails={setActiveNFTDetails}
            />
          ) : (
            <TokenList 
              activeTooltip={activeTooltip}
              setActiveTooltip={setActiveTooltip}
            />
          )}
        </>
      )}
    </div>
  );
};

export default HoldingsContainer;