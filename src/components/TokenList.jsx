import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { TokenContext } from '../utils/TokenContext';
import { shortener } from '../utils/utils'; // Ajout de l'import
import Pagination from '../components/Pagination';

const TokenList = ({ activeTooltip, setActiveTooltip }) => {
  const { processedHoldings } = useContext(TokenContext);
  const fungibleTokens = processedHoldings?.fungibleTokens || [];
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const displayTokens = fungibleTokens.map(token => {
    let displayName = getDisplayName(token);
    // Vérification de la longueur et application de shortener si nécessaire
    if (displayName.length > 30) {
      displayName = shortener(displayName);
    }
    return {
      ...token,
      displayName: displayName
    };
  });

  const totalPages = Math.ceil(displayTokens.length / itemsPerPage);
  const paginatedTokens = displayTokens.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-full mx-auto">
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        totalItems={displayTokens.length}
      />
      
      <div className="overflow-x-auto p-4">
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
                <td className="flex items-center gap-4 p-2 truncate">
                  <div className="relative truncate">
                    {token.isLoadingMetadata ? (
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
                  </div>
                  <Link 
                    to={`/asset/${token.unit}`} 
                    className="font-semibold hover:text-primary"
                  >
                    {token.displayName}
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
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        totalItems={displayTokens.length}
      />
    </div>
  );
};

export default TokenList;