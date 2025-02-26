import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CurrencyListWithCharts from '../components/CurrencyListWithCharts';
import { API_CONFIG } from '../utils/apiConfig';

const PricesPage = () => {
  const [pricesData, setPricesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [circulatingSupply, setCirculatingSupply] = useState(0);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        // Récupérer les données de prix
        const pricesResponse = await axios.get(`${API_CONFIG.baseUrl}last24prices/`);
        
        // Récupérer également le circulating_supply depuis l'endpoint epochcontext
        const epochContextResponse = await axios.get(`${API_CONFIG.baseUrl}epochcontext/`);
        
        // Traitement des données de prix (inversée pour afficher les plus récentes en premier)
        const formattedPricesData = Object.values(pricesResponse.data || {}).reverse();
        
        // Mise à jour des états
        setPricesData(formattedPricesData);
        setCirculatingSupply(epochContextResponse.data?.circulating_supply || 0);
        setIsLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des données de prix:", error);
        setError("Impossible de charger les données de prix");
        setIsLoading(false);
      }
    };

    fetchPriceData();
  }, []);

  if (error) {
    return (
      <div className="rounded-xl shadow-xl p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <CurrencyListWithCharts data={pricesData} circulatingSupply={circulatingSupply} />

      )}
              <p className="text-base-content"><img src="/assets/orcfax.svg" className="w-24 mx-auto" />
          Prices from Orcfax public feed.</p>
    </div>
  );
};

export default PricesPage;