import React, { useState, useEffect, useContext } from 'react';
import { getColorForAddress, convertLovelaceToAda } from '../utils/utils';
import { TokenContext } from "../utils/TokenContext";

function EUTXOTab({ inputs, outputs, resolvedAmounts, tokenMetadata }) {
  const [unitLogos, setUnitLogos] = useState({});

  useEffect(() => {
    const cacheLogosFromAmounts = (amounts) => {
      amounts.forEach((a) => {
        const unit = a.unit === 'lovelace' ? 'ADA' : a.unit;
        if (!unitLogos[unit] && tokenMetadata[unit]?.logo) {
          setUnitLogos(prev => ({ ...prev, [unit]: tokenMetadata[unit].logo }));
        }
      });
    };
    
    Object.values(resolvedAmounts).forEach(cacheLogosFromAmounts);
  }, [resolvedAmounts, tokenMetadata]);
//console.log(resolvedAmounts);
  const renderAmount = (amounts) => {
    if (!amounts) return "Loading...";
  
    return (
      <div className="flex flex-col items-center">
        {amounts.map((a, idx) => {
          const isADA = a.unit === "lovelace";
          const unit = isADA ? "ADA" : a.unit;
          const quantity = (a.quantity / 10 ** (isADA ? 6 : 0)).toFixed(isADA ? 6 : 0);
          const logoSrc = unitLogos[unit] || "/assets/cardano.webp";

          return (
            <div key={`${unit}-${idx}`} className="flex items-center mb-2">
              <span className="ml-2 text-center">{quantity} {unit}</span>
              <img 
                src={logoSrc} 
                alt={unit} 
                className="ml-2 w-6 h-6" 
              />
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
            <div style={{ color: getColorForAddress(input.address) }}>
              <strong>Address:</strong> <span className="ml-2">{input.address}</span>
            </div>
            <div className="text-center">
              <strong>Amount:</strong> 
              {renderAmount(resolvedAmounts[`input-${index}`])}
            </div>
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
              {renderAmount(resolvedAmounts[`output-${index}`])}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EUTXOTab;