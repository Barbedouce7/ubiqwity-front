import React from 'react';
import { getColorForAddress } from '../utils/utils';
import CopyButton from '../components/CopyButton';
import GetHandle from './GetHandle';
import { Link } from 'react-router-dom';
import { shortener } from '../utils/utils';

function EUTXOTab({ inputs, outputs }) {
  const renderAmount = (amounts) => (
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

  return (
<div className="grid md:grid-cols-2 gap-4">

  <div className="md:col-span-1">
    <h2 className="text-xl font-bold mb-2 text-blue-500">
      {inputs.length} Input{inputs.length !== 1 ? 's' : ''}
    </h2>
    {inputs.map((input, index) => (
      <div key={`input-${index}`} className="relative card text-base-content bg-base-100 shadow-xl mb-4 border border-blue-500 p-4">
        {/* Titre discret en haut à gauche */}
        <span className="absolute top-2 left-2 text-sm font-semibold opacity-70">Input {index + 1}</span>
        <div className="card-body mt-4">
          <div>
            <div> <GetHandle stakekey={input.address} /> </div>
            <strong>Address:</strong> <CopyButton text={input.address} />
            <span className="ml-2">
              <Link className="text-sky-500" to={`/wallet/${input.address}`}>
                {shortener(input.address)}
              </Link>
            </span>
          </div>
          <div className="text-center">
            <strong>Amount:</strong> {renderAmount(input.amount)}
          </div>
          {renderUTXOInfo(input)}
        </div>
      </div>
    ))}
  </div>

  <div className="md:col-span-1">
    <h2 className="text-xl font-bold mb-2 text-orange-500">
      {outputs.length} Output{outputs.length !== 1 ? 's' : ''}
    </h2>
    {outputs.map((output, index) => (
      <div key={`output-${index}`} className="relative card text-base-content bg-base-100 shadow-xl mb-4 border border-orange-500 p-4">
        {/* Titre discret en haut à gauche */}
        <span className="absolute top-2 left-2 text-sm font-semibold opacity-70">Output {index + 1}</span>
        <div className="card-body mt-4">
          <div>
            <div> <GetHandle stakekey={output.address} /> </div>
            <strong>Address:</strong> <CopyButton text={output.address} />
            <span className="ml-2">
              <Link className="text-sky-500" to={`/wallet/${output.address}`}>
                {shortener(output.address)}
              </Link>
            </span>
          </div>
          <div className="text-center">
            <strong>Amount:</strong> {renderAmount(output.amount)}
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
