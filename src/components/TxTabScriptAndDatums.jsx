import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import CopyButton from '../components/CopyButton';
import { shortener } from '../utils/utils';
import { Link } from "react-router-dom";

const TxTabScriptsAndDatums = ({ data }) => {
  const { utxos } = data;
  
  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const hasContent = (item) => {
    return item.reference_script_hash || item.data_hash || item.inline_datum || item.consumed_by_tx;
  };

  const displayInputs = utxos.inputs.map((input, index) => ({
    ...input,
    originalIndex: index,
    hasContent: hasContent(input)
  })).filter(input => input.hasContent);

  const displayOutputs = utxos.outputs.map((output, index) => ({
    ...output,
    originalIndex: index,
    hasContent: hasContent(output)
  })).filter(output => output.hasContent);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Inputs Section */}
      <div>
        <h2 className="text-lg font-semibold mb-2 text-sky-500">
          {utxos.inputs.length} Input{utxos.inputs.length !== 1 ? 's' : ''}
        </h2>
        <div className="space-y-4">
          {displayInputs.map((input) => (
            <div 
              key={`${input.tx_hash}-${input.output_index}`} 
              className="border-2 border-sky-500/50 rounded-lg overflow-hidden bg-sky-500/5"
            >
              <div className="px-3 py-1 border-b border-sky-500/30 flex items-center justify-between">
                <span className="text-xs font-medium">Input {input.originalIndex + 1}</span>
                {input.reference && (
                  <span className="px-2 py-0.5 text-xs bg-sky-500/20 rounded-full">
                    Reference
                  </span>
                )}
              </div>
              
              <div className="p-3 space-y-2">
                {input.reference_script_hash && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-70">Reference Script Hash:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{truncateHash(input.reference_script_hash)}</span>
                      <CopyButton text={input.reference_script_hash} />
                    </div>
                  </div>
                )}
                
                {input.data_hash && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-70">Data Hash:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{truncateHash(input.data_hash)}</span>
                      <CopyButton text={input.data_hash} />
                    </div>
                  </div>
                )}
                
                {input.inline_datum && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-70">Inline Datum:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono break-all">{truncateHash(input.inline_datum)}</span>
                      <CopyButton text={input.inline_datum} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outputs Section */}
      <div>
        <h2 className="text-lg font-semibold mb-2 text-orange-500">
          {utxos.outputs.length} Output{utxos.outputs.length !== 1 ? 's' : ''}
        </h2>
        <div className="space-y-4">
          {displayOutputs.map((output, index) => (
            <div 
              key={index} 
              className="border-2 border-orange-500/50 rounded-lg overflow-hidden bg-orange-500/5"
            >
              <div className="px-3 py-1 border-b border-orange-500/30 flex items-center justify-between">
                <span className="text-xs font-medium">Output {index + 1}</span>
                {output.collateral && (
                  <span className="px-2 py-0.5 text-xs bg-orange-500/20 rounded-full">
                    Collateral
                  </span>
                )}
              </div>
              
              <div className="p-3 space-y-2">
                {output.reference_script_hash && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-70">Reference Script Hash:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{truncateHash(output.reference_script_hash)}</span>
                      <CopyButton text={output.reference_script_hash} />
                    </div>
                  </div>
                )}
                
                {output.data_hash && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-70">Data Hash:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{truncateHash(output.data_hash)}</span>
                      <CopyButton text={output.data_hash} />
                    </div>
                  </div>
                )}
                
                {output.inline_datum && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-70">Inline Datum:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono break-all">{truncateHash(output.inline_datum)}</span>
                      <CopyButton text={output.inline_datum} />
                    </div>
                  </div>
                )}
                
                {output.consumed_by_tx && (
                  <div className="flex items-center justify-between text-sm">
                    
                    <div className="flex items-center gap-1">
                    <span className="opacity-70">Consumed By TX:</span>
                      <Link to={`tx/${output.consumed_by_tx}`} className="text-sky-500">{shortener(output.consumed_by_tx)}</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TxTabScriptsAndDatums;