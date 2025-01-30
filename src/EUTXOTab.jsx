import React from 'react';
import { getColorForAddress, convertLovelaceToAda } from './utils';

function EUTXOTab({ inputs, outputs, resolvedAmounts }) {
  //console.log('resolvedAmounts in EUTXOTab:', resolvedAmounts); 

const renderAmount = (amounts, ioType, index) => {
  return (
    <div className="flex flex-col items-center">
      {amounts.map((a, idx) => {
        const unit = a.unit === 'lovelace' ? 'ADA' : a.unit;
        const quantity = unit === 'ADA' 
          ? convertLovelaceToAda(a.quantity)
          : (a.quantity / (10 ** (unit === 'ADA' ? 6 : 0))).toFixed(unit === 'ADA' ? 6 : 0);

        return (
          <div key={`${unit}-${idx}`} className="flex items-center mb-2">
            <span className="ml-2 text-center">{quantity} {unit}</span>
            {a.logo && 
              <img src={`data:image/png;base64,${a.logo}`} alt={unit} className="ml-2 w-6 h-6" />
            }
          </div>
        );
      })}
    </div>
  );
};
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Inputs</h2>
      {inputs.map((input, index) => (
        <div key={`input-${index}`} className="card bg-base-300 shadow-xl mb-4">
          <div className="card-body">
            <h3 className="card-title">Input {index + 1}</h3>
            <div className="line-clamp-3" style={{ color: getColorForAddress(input.address) }}>
              <strong>Address:</strong> 
              <span className="ml-2">{input.address}</span>
            </div>
            <div className="text-center">
              <strong>Amount:</strong> 
              {resolvedAmounts[`input-${index}`] ? 
                renderAmount(resolvedAmounts[`input-${index}`], 'input', index) : 
                'Loading...'}
            </div>
          </div>
        </div>
      ))}
      <h2 className="text-xl font-bold mb-2 mt-4">Outputs</h2>
      {outputs.map((output, index) => (
        <div key={`output-${index}`} className="card bg-base-300 shadow-xl mb-4">
          <div className="card-body">
            <h3 className="card-title">Output {index + 1}</h3>
            <div className="line-clamp-3" style={{ color: getColorForAddress(output.address) }}>
              <strong>Address:</strong> 
              <span className="ml-2">{output.address}</span>
            </div>
            <div className="text-center">
              <strong>Amount:</strong> 
              {renderAmount(output.amount, 'output', index)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EUTXOTab;