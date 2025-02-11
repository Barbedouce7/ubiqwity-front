import React, { useState, useEffect, useContext  } from 'react';
import axios from 'axios';
//import { API_CONFIG } from '../utils/apiConfig';
import { shortener } from '../utils/utils';
import { TokenContext } from '../utils/TokenContext';


const HoldingsComponent = ({ holdingsData }) => {
  const [holdings, setHoldings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adaBalance, setAdaBalance] = useState('0');
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);

  console.log("📌 localstorage :", tokenMetadata);

  useEffect(() => {


    const fetchHoldings = async () => {
      if (!holdingsData?.holdings) {
        //console.log("⚠️ Aucune donnée de holdings reçue.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      //console.log("🔍 Holdings détectés:", holdingsData.holdings);

      const updatedHoldings = [];

      for (let holding of holdingsData.holdings) {
        //console.log(`📌 Traitement de l'unité ${holding.unit}`);

        if (holding.unit === 'lovelace') {
          setAdaBalance(formatQuantity(holding.quantity, 6));
          continue; // On passe à l'élément suivant
        }

        let metadata = tokenMetadata[holding.unit];

        if (!metadata) {
          //console.log(`⚠️ Métadonnées manquantes pour ${holding.unit}, appel API...`);
          metadata = await fetchTokenData(holding.unit);
        }

        updatedHoldings.push({
          unit: holding.unit,
          quantity: parseInt(holding.quantity),
          decimals: metadata?.decimals || holding.decimals || 0,
          ticker: metadata?.ticker || shortener(holding.unit),
          logo: metadata?.logo || null,
          name: metadata?.name || "Unknown Token",
        });
      }

      // Trie les holdings : ceux avec un logo d'abord
      updatedHoldings.sort((a, b) => (b.logo ? 1 : 0) - (a.logo ? 1 : 0));

      setHoldings(updatedHoldings);
      setIsLoading(false);
    };

    fetchHoldings();
  }, [holdingsData, tokenMetadata]);

  // Formatage de la quantité en fonction des décimales
  const formatQuantity = (quantity, decimals) => {
    return decimals ? (quantity / Math.pow(10, decimals)).toFixed(decimals) : quantity;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500 mt-10"></div>
      </div>
    );
  }

  return (
    <div className="holdings">
      {/* Affichage du solde ADA */}
      <div className="card shadow-xl mb-10 max-w-lg mx-auto p-4">
        <h2 className="text-xl font-bold mb-4 text-center">
          {adaBalance} <img src="/assets/cardano.webp" alt="ADA" className="iconCurrency inline-block mr-2 rounded-full w-10 h-10" />
        </h2>
      </div>

      {/* Liste des tokens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {holdings.map((holding, index) => (
          <div key={index} className="card text-base-content bg-base-100 text-white shadow-2xl rounded-lg overflow-hidden">
            <div className="card-body p-4 flex flex-col items-center text-center">
              {holding.logo && (
                <figure className="mb-2">
                  <img
                    src={`data:image/png;base64,${holding.logo}`}
                    alt={`${holding.name} Logo`}
                    className="h-32 w-32 object-cover rounded-full"
                  />
                </figure>
              )}
              <p className="text-lg font-semibold">
                <strong>{formatQuantity(holding.quantity, holding.decimals)}</strong> {holding.ticker}
              </p>
              <p className="text-sm text-gray-400">{holding.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoldingsComponent;