import React, { useContext, useEffect, useState } from 'react';
import { getColorForAddress } from '../utils/utils';
import CopyButton from '../components/CopyButton';
import GetHandle from './GetHandle';
import { Link } from 'react-router-dom';
import { shortener } from '../utils/utils';
import { TokenContext } from '../utils/TokenContext';

function EUTXOTab({ inputs, outputs }) {
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
      // Process inputs
      const processedInputPromises = inputs.map(async (input) => ({
        ...input,
        processedAmount: await processAmount(input.amount)
      }));

      // Process outputs
      const processedOutputPromises = outputs.map(async (output) => ({
        ...output,
        processedAmount: await processAmount(output.amount)
      }));

      const [newProcessedInputs, newProcessedOutputs] = await Promise.all([
        Promise.all(processedInputPromises),
        Promise.all(processedOutputPromises)
      ]);

      setProcessedInputs(newProcessedInputs);
      setProcessedOutputs(newProcessedOutputs);
    };

    processUTXOs();
  }, [inputs, outputs, tokenMetadata, fetchTokenData]);

  const renderAmount = (processedAmount) => (
    <div className="flex flex-col items-center">
      {processedAmount.map((a, idx) => {
        const logoUrl = a.metadata?.logo ? `/tokenimages/${a.unit}.png` : null;
        return (
          <div key={`${a.unit}-${idx}`} className="flex items-center mb-2">
            {logoUrl && (
              <img 
                src={logoUrl}
                alt={`${a.displayUnit} Logo`}
                className="h-6 w-6 object-cover rounded-full mr-2"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <span className="ml-2 text-center">
              {a.displayQuantity} {a.displayUnit}
              {a.unit !== 'lovelace' && (
                <CopyButton text={a.unit} className="ml-2" />
              )}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderUTXOInfo = (utxo) => (
    <div>
      {utxo.inline_datum && <div><strong>Inline Datum:</strong> <CopyButton text={utxo.inline_datum} /></div>}
      {utxo.collateral && <div><strong>Collateral:</strong> Yes</div>}
      {utxo.reference_script_hash && (
        <div><strong>Reference Script Hash: </strong> <CopyButton text={utxo.reference_script_hash} /> {shortener(utxo.reference_script_hash)}</div>
      )}
      {utxo.consumed_by_tx && (
        <div>
          <strong>Consumed By TX:</strong> <CopyButton text={utxo.consumed_by_tx} />
          <Link className="text-sky-500" to={`/tx/${utxo.consumed_by_tx}`}>{shortener(utxo.consumed_by_tx)}</Link>
        </div>
      )}
    </div>
  );

  if (!processedInputs.length || !processedOutputs.length) {
    return <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="md:col-span-1">
        <h2 className="text-xl font-bold mb-2 text-blue-500">
          {processedInputs.length} Input{processedInputs.length !== 1 ? 's' : ''}
        </h2>
        {processedInputs.map((input, index) => (
          <div key={`input-${index}`} className="relative card text-base-content bg-base-100 shadow-xl mb-4 border border-blue-500 p-4">
            <span className="absolute top-2 left-2 text-sm font-semibold opacity-70">Input {index + 1}</span>
            <div className="card-body mt-4">
              <div>
                <div><GetHandle stakekey={input.address} /></div>
                <strong>Address:</strong> <CopyButton text={input.address} />
                <span className="ml-2">
                  <Link className="text-sky-500" to={`/wallet/${input.address}`}>
                    {shortener(input.address)}
                  </Link>
                </span>
              </div>
              <div className="text-center">
                <strong>Amount:</strong> {renderAmount(input.processedAmount)}
              </div>
              {renderUTXOInfo(input)}
            </div>
          </div>
        ))}
      </div>
      <div className="md:col-span-1">
        <h2 className="text-xl font-bold mb-2 text-orange-500">
          {processedOutputs.length} Output{processedOutputs.length !== 1 ? 's' : ''}
        </h2>
        {processedOutputs.map((output, index) => (
          <div key={`output-${index}`} className="relative card text-base-content bg-base-100 shadow-xl mb-4 border border-orange-500 p-4">
            <span className="absolute top-2 left-2 text-sm font-semibold opacity-70">Output {index + 1}</span>
            <div className="card-body mt-4">
              <div>
                <div><GetHandle stakekey={output.address} /></div>
                <strong>Address:</strong> <CopyButton text={output.address} />
                <span className="ml-2">
                  <Link className="text-sky-500" to={`/wallet/${output.address}`}>
                    {shortener(output.address)}
                  </Link>
                </span>
              </div>
              <div className="text-center">
                <strong>Amount:</strong> {renderAmount(output.processedAmount)}
              </div>
              {renderUTXOInfo(output)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EUTXOTab;