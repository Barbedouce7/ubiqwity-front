import React, { useContext } from 'react';
import { TokenContext } from '../utils/TokenContext';

const NFTGallery = ({ activeNFTDetails, setActiveNFTDetails }) => {
  const { processedHoldings } = useContext(TokenContext);
  const nftTokens = processedHoldings?.nftTokens || [];

  const getDisplayName = (token) => {
    if (token.onchainMetadata?.name) return token.onchainMetadata.name;
    if (token.hasMetadata) {
      if (token.ticker && token.ticker !== "null") return token.ticker;
      if (token.name && token.name !== "null") return token.name;
    }
    return token.assetName || '???';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {nftTokens.map(token => (
        <div 
          key={token.unit} 
          className="card bg-base-100 shadow-xl cursor-pointer relative"
          onClick={() => !token.isLoadingMetadata && setActiveNFTDetails(activeNFTDetails === token.unit ? null : token.unit)}
        >
          <div className="card-body items-center text-center space-y-4">
            {token.isLoadingMetadata ? (
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
              </p>
            </div>
          </div>

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
  );
};

export default NFTGallery;