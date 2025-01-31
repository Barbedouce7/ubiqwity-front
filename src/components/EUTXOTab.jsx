import React from 'react';
import { getColorForAddress } from '../utils/utils';
import CopyButton from '../components/CopyButton';


function EUTXOTab({ inputs, outputs }) {
  const renderAmount = (amounts) => {
    return (
      <div className="flex flex-col items-center">
        {amounts.map((a, idx) => {
          const unit = a.unit === 'lovelace' ? 'ADA' : a.unit;
          const quantity = a.unit === 'lovelace' ? (a.quantity / 1000000).toFixed(6) : a.quantity;

          return (
            <div key={`${unit}-${idx}`} className="flex items-center mb-2">
              <span className="ml-2 text-center">{quantity} {unit}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderUTXOInfo = (utxo) => {
    return (
      <div>
        {utxo.inline_datum && <div><strong>Inline Datum:</strong> Yes <CopyButton text={utxo.inline_datum} /></div>}
        {utxo.collateral && <div><strong>Collateral:</strong> Yes</div>}
        {utxo.reference_script_hash && <div><strong>Reference Script Hash: <CopyButton text={utxo.reference_script_hash} /></strong> {utxo.reference_script_hash}</div>}
        {utxo.consumed_by_tx && <div><strong>Consumed By TX:  <CopyButton text={utxo.consumed_by_tx} /></strong> {utxo.consumed_by_tx}</div>}
      </div>
    );
  };

  return (
    <div>
      <p>{inputs.length} Input{inputs.length !== 1 ? 's' : ''} | {outputs.length} Output{outputs.length !== 1 ? 's' : ''}</p>

      <h2 className="text-xl font-bold mb-2">Inputs</h2>
      {inputs.map((input, index) => (
        <div key={`input-${index}`} className="card bg-base-300 shadow-xl mb-4">
          <div className="card-body">
            <h3 className="card-title">Input {index + 1}</h3>
            <div style={{ color: getColorForAddress(input.address) }}>
              <strong>Address:</strong> <CopyButton text={input.address} /><span className="ml-2">{input.address}</span>
            </div>
            <div className="text-center">
              <strong>Amount:</strong> 
              {renderAmount(input.amount)}
            </div>
            {renderUTXOInfo(input)}
          </div>
        </div>
      ))}

      <h2 className="text-xl font-bold mb-2 mt-4">Outputs</h2>
      {outputs.map((output, index) => (
        <div key={`output-${index}`} className="card bg-base-300 shadow-xl mb-4">
          <div className="card-body">
            <h3 className="card-title">Output {index + 1}</h3>
            <div style={{ color: getColorForAddress(output.address) }}>
              <strong>Address:</strong> <span className="ml-2">{output.address}</span>
            </div>
            <div className="text-center">
              <strong>Amount:</strong> 
              {renderAmount(output.amount)}
            </div>
            {renderUTXOInfo(output)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default EUTXOTab;