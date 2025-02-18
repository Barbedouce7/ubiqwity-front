import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ClipboardIcon,
  ArrowTopRightOnSquareIcon 
} from '@heroicons/react/24/solid';
import { TokenContext } from '../utils/TokenContext';
import { shortener } from '../utils/utils';
import GetHandle from '../components/GetHandle';
import CopyButton from '../components/CopyButton';

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex justify-center items-center gap-1 mt-1">
    <button
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}
      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors"
    >
      <ChevronLeftIcon className="h-3 w-3" />
    </button>
    <span className="text-xs font-medium">
      {currentPage} / {totalPages}
    </span>
    <button
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}
      className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 transition-colors"
    >
      <ChevronRightIcon className="h-3 w-3" />
    </button>
  </div>
);

const AssetsTable = ({ assets, pageSize = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(assets.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const displayedAssets = assets.slice(startIndex, startIndex + pageSize);

  const extractAssetNameFromPolicy = (unit) => {
    if (unit === 'lovelace') return null;
    try {
      const assetPart = unit.slice(56);
      return assetPart ? Buffer.from(assetPart, 'hex').toString('utf8') : null;
    } catch {
      return null;
    }
  };

  return (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-1 px-2 text-xs font-medium opacity-70">Asset</th>
            <th className="text-right py-1 px-2 text-xs font-medium opacity-70">Amount</th>
          </tr>
        </thead>
        <tbody>
          {displayedAssets.map((asset, idx) => {
            const logoUrl = asset.unit === 'lovelace' 
              ? "/assets/cardano.webp" 
              : asset.metadata?.logo ? `/tokenimages/${asset.unit}.png` : null;
            const extractedName = asset.unit !== 'lovelace' ? extractAssetNameFromPolicy(asset.unit) : null;
            
            return (
              <tr key={`${asset.unit}-${idx}`} >
                <td className="py-1 px-2">
                  <div className="flex items-center gap-2">
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt=""
                        className="h-4 w-4 rounded-full"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {shortener(asset.displayUnit)}
                      </span>
                      {extractedName && (
                        <span className="text-xs opacity-70 truncate">
                          {extractedName}
                        </span>
                      )}
                    </div>
                    {asset.unit !== 'lovelace' && (
                      <CopyButton text={asset.unit} />
                    )}
                  </div>
                </td>
                <td className="py-1 px-2 text-right font-mono text-sm">
                  {asset.displayQuantity}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

const UTXOCard = ({ data, type, index, handleComponent }) => {
  const borderColor = type === 'input' ? 'border-blue-500/50' : 'border-orange-500/50';
  
  return (
    <div className={`relative border-2 ${borderColor} rounded-lg overflow-hidden`}>
      <div className="px-3 py-1 border-b border-gray-500 flex items-center justify-between">
        <span className="text-xs font-medium">
          {type === 'input' ? 'Input' : 'Output'} {index + 1}
        </span>
        {handleComponent}
      </div>
      
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="opacity-70">Address:</span>
          <div className="flex items-center gap-1">
            <Link 
              to={`/wallet/${data.address}`}
              className="text-sky-500 hover:text-sky-600 transition-colors"
            >
              {shortener(data.address)}
            </Link>
            <CopyButton text={data.address} />
            <Link 
              to={`/wallet/${data.address}`} 
              target="_blank"
              className="hover:bg-gray-100 rounded transition-colors"
            >
            </Link>
          </div>
        </div>

        {(data.inline_datum || data.collateral || data.reference_script_hash || data.consumed_by_tx) && (
          <div className="space-y-2 pt-2 border-t border-gray-500">
            {data.inline_datum && (
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-70">Inline Datum:</span>
                <div className="flex items-center gap-1">
                  <span className="truncate max-w-[200px]">{shortener(data.inline_datum)}</span>
                  <CopyButton text={data.inline_datum} />
                </div>
              </div>
            )}
            
            {data.collateral && (
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-70">Collateral:</span>
                <span>Yes</span>
              </div>
            )}
            
            {data.reference_script_hash && (
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-70">Reference Script:</span>
                <div className="flex items-center gap-1">
                  <span className="truncate max-w-[200px]">{shortener(data.reference_script_hash)}</span>
                  <CopyButton text={data.reference_script_hash} />
                </div>
              </div>
            )}
            
            {data.consumed_by_tx && (
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-70">Consumed By TX:</span>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/tx/${data.consumed_by_tx}`}
                    className="text-sky-500 hover:text-sky-600 transition-colors truncate max-w-[200px]"
                  >
                    {shortener(data.consumed_by_tx)}
                  </Link>
                  <CopyButton text={data.consumed_by_tx} />
                  <Link 
                    to={`/tx/${data.consumed_by_tx}`} 
                    target="_blank"
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-2">
          <AssetsTable assets={data.processedAmount} />
        </div>
      </div>
    </div>
  );
};

const EUTXOTab = ({ inputs, outputs }) => {
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);
  const [processedInputs, setProcessedInputs] = useState([]);
  const [processedOutputs, setProcessedOutputs] = useState([]);

  // Create a map of addresses to their GetHandle components
  const addressHandles = useMemo(() => {
    const addresses = new Set([
      ...inputs.map(input => input.address),
      ...outputs.map(output => output.address)
    ]);
    
    const handleMap = {};
    addresses.forEach(address => {
      handleMap[address] = <GetHandle stakekey={address} />;
    });
    
    return handleMap;
  }, [inputs, outputs]);

  const formatQuantity = (quantity, decimals) => {
    if (!quantity) return "0";
    return decimals ? 
      (Number(quantity) / Math.pow(10, decimals)).toFixed(decimals) : 
      quantity.toString();
  };

  const processAmount = async (amount) => {
    return Promise.all(amount.map(async (a) => {
      if (a.unit === 'lovelace') {
        return {
          ...a,
          displayUnit: 'ADA',
          displayQuantity: (a.quantity / 1000000).toFixed(6)
        };
      }

      try {
        const metadata = tokenMetadata[a.unit] || await fetchTokenData(a.unit);
        return {
          ...a,
          displayUnit: metadata?.ticker || metadata?.name || a.unit,
          displayQuantity: formatQuantity(a.quantity, metadata?.decimals || 0),
          metadata
        };
      } catch (error) {
        console.error(`Error processing token ${a.unit}:`, error);
        return {
          ...a,
          displayUnit: a.unit,
          displayQuantity: a.quantity
        };
      }
    }));
  };

  useEffect(() => {
    const processUTXOs = async () => {
      const [newProcessedInputs, newProcessedOutputs] = await Promise.all([
        Promise.all(inputs.map(async (input) => ({
          ...input,
          processedAmount: await processAmount(input.amount)
        }))),
        Promise.all(outputs.map(async (output) => ({
          ...output,
          processedAmount: await processAmount(output.amount)
        })))
      ]);

      setProcessedInputs(newProcessedInputs);
      setProcessedOutputs(newProcessedOutputs);
    };

    processUTXOs();
  }, [inputs, outputs, tokenMetadata, fetchTokenData]);

  if (!processedInputs.length && !processedOutputs.length) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <h2 className="text-lg font-semibold mb-2 text-blue-500">
          {processedInputs.length} Input{processedInputs.length !== 1 ? 's' : ''}
        </h2>
        {processedInputs.map((input, index) => (
          <div key={`input-${index}`} className="mb-4">
            <UTXOCard 
              data={input}
              type="input"
              index={index}
              handleComponent={addressHandles[input.address]}
            />
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2 text-orange-500">
          {processedOutputs.length} Output{processedOutputs.length !== 1 ? 's' : ''}
        </h2>
        {processedOutputs.map((output, index) => (
          <div key={`output-${index}`} className="mb-4">
            <UTXOCard
              data={output}
              type="output"
              index={index}
              handleComponent={addressHandles[output.address]}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EUTXOTab;