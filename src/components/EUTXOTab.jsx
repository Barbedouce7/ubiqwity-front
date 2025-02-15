import React, { useContext, useEffect, useState } from 'react';
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


const CopyButton = ({ text, className = '' }) => (
  <button 
    onClick={() => navigator.clipboard.writeText(text)}
    className={`p-1 hover:opacity-75 transition-opacity ${className}`}
  >
    <ClipboardIcon className="h-4 w-4" />
  </button>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex justify-center items-center gap-2 mt-2">
    <button
      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      disabled={currentPage === 1}
      className="p-1 hover:opacity-75 disabled:opacity-50 transition-opacity"
    >
      <ChevronLeftIcon className="h-4 w-4" />
    </button>
    <span className="text-sm font-medium">
      {currentPage} / {totalPages}
    </span>
    <button
      onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      disabled={currentPage === totalPages}
      className="p-1 hover:opacity-75 disabled:opacity-50 transition-opacity"
    >
      <ChevronRightIcon className="h-4 w-4" />
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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-4 border-b">Asset</th>
              <th className="text-right py-2 px-4 border-b">Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayedAssets.map((asset, idx) => {
              const logoUrl = asset.unit === 'lovelace'  ? "/assets/cardano.webp" : asset.metadata?.logo  ? `/tokenimages/${asset.unit}.png`  : null;
              const extractedName = asset.unit !== 'lovelace' ? extractAssetNameFromPolicy(asset.unit) : null;
              
              return (
                <tr key={`${asset.unit}-${idx}`}>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center space-x-2">
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt=""
                          className="h-6 w-6 rounded-full"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">
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
                  <td className="py-2 px-4 border-b text-right font-mono">
                    {asset.displayQuantity}
                  </td>
                </tr>
              );
            })}
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
  );
};

const UTXOCard = ({ data, type, index }) => {
  const borderColor = type === 'input' ? 'border-blue-500' : 'border-orange-500';
  
  return (
    <div className={`relative border-2 ${borderColor} rounded-lg overflow-hidden`}>
      <span className="absolute top-2 left-2 text-sm font-semibold opacity-70">
        {type === 'input' ? 'Input' : 'Output'} {index + 1}
      </span>
      
      <div className="p-2 mt-4">
        <div className="space-y-2">
          <GetHandle stakekey={data.address} />
          
          <div className="flex items-center justify-center min-w-0">
            <span className="font-semibold">Address:</span>
            <span className="ml-3 mr-3">{shortener(data.address)}</span>
            <CopyButton text={data.address} />
            <Link 
              to={`/wallet/${data.address}`}
              className="text-sky-500 hover:opacity-75 transition-opacity"
            >
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-2 border-t-2">
          <AssetsTable assets={data.processedAmount} />
        </div>

        {(data.inline_datum || data.collateral || data.reference_script_hash || data.consumed_by_tx) && (
          <div className="mt-4 pt-4  space-y-2">
            {data.inline_datum && (
              <div className="space-y-1">
                <span className="font-semibold">Inline Datum:</span>
                <div className="flex items-center space-x-2">
                  <span className="truncate">{data.inline_datum}</span>
                  <CopyButton text={data.inline_datum} />
                </div>
              </div>
            )}
            
            {data.collateral && (
              <div>
                <span className="font-semibold">Collateral:</span> Yes
              </div>
            )}
            
            {data.reference_script_hash && (
              <div className="space-y-1">
                <span className="font-semibold">Reference Script Hash:</span>
                <div className="flex items-center space-x-2">
                  <span className="truncate">{data.reference_script_hash}</span>
                  <CopyButton text={data.reference_script_hash} />
                </div>
              </div>
            )}
            
            {data.consumed_by_tx && (
              <div className="space-y-1">
                <span className="font-semibold">Consumed By TX:</span>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/tx/${data.consumed_by_tx}`}
                    className="text-sky-500 hover:opacity-75 transition-opacity truncate"
                  >
                    {data.consumed_by_tx}
                  </Link>
                  <CopyButton text={data.consumed_by_tx} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EUTXOTab = ({ inputs, outputs }) => {
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);
  const [processedInputs, setProcessedInputs] = useState([]);
  const [processedOutputs, setProcessedOutputs] = useState([]);

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
        <h2 className="text-xl font-bold mb-2 text-blue-500">
          {processedInputs.length} Input{processedInputs.length !== 1 ? 's' : ''}
        </h2>
        {processedInputs.map((input, index) => (
          <div key={`input-${index}`} className="mb-6 shadow-xl">
            <UTXOCard 
              data={input}
              type="input"
              index={index}
            />
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2 text-orange-500">
          {processedOutputs.length} Output{processedOutputs.length !== 1 ? 's' : ''}
        </h2>
        {processedOutputs.map((output, index) => (
          <div key={`output-${index}`} className="mb-6 shadow-xl">
            <UTXOCard
              data={output}
              type="output"
              index={index}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EUTXOTab;