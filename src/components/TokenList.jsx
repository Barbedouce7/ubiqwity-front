import React from 'react';
import { Link } from 'react-router-dom';
import CopyButton from '../components/CopyButton';
import { shortener } from '../utils/utils';

const TokenList = ({ tokens, isDataReady, activeTooltip, setActiveTooltip, formatQuantity }) => (
  <div className="overflow-x-auto p-4 max-w-lg mx-auto">
    <table className="w-full">
      <thead>
        <tr>
          <th className="text-left">Asset | Ticker</th>
          <th className="text-right">Quantity</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => (
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
);

export default TokenList;