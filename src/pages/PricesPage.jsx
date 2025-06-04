import React, { useState, useEffect } from "react";
import axios from "axios";
import CurrencyListWithCharts from "../components/CurrencyListWithCharts";
import StablecoinChart from "../components/StablecoinChart";
import { API_CONFIG } from "../utils/apiConfig";

const PricesPage = () => {
  const [pricesData, setPricesData] = useState([]);
  const [stablecoinData, setStablecoinData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [circulatingSupply, setCirculatingSupply] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Set dynamic date range (last 4 days)
        const endDate = new Date().toISOString(); // Current date and time
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 4 days ago

        // Fetch price data
        const pricesResponse = await axios.get(`${API_CONFIG.baseUrl}last24prices/`);
        
        // Fetch circulating supply
        const epochContextResponse = await axios.get(`${API_CONFIG.baseUrl}epochcontext/`);
        
        // Fetch stablecoin data
        const stablecoinResponse = await axios.get(
          `${API_CONFIG.baseUrl}stable?startDate=${startDate}&endDate=${endDate}`
        );

        // Log the raw response for debugging
        console.log("Stablecoin API response:", stablecoinResponse.data);

        // Process price data
        const formattedPricesData = Object.values(pricesResponse.data || {}).reverse();
        
        // Process stablecoin data
        let formattedStablecoinData = [];
        if (Array.isArray(stablecoinResponse.data)) {
          formattedStablecoinData = stablecoinResponse.data;
        } else if (stablecoinResponse.data?.stablecoins) {
          formattedStablecoinData = stablecoinResponse.data.stablecoins;
        } else {
          console.warn("Unexpected stablecoin data format:", stablecoinResponse.data);
        }

        // Log the formatted data
        console.log("Formatted stablecoin data:", formattedStablecoinData);

        // Update states
        setPricesData(formattedPricesData);
        setStablecoinData(formattedStablecoinData);
        setCirculatingSupply(epochContextResponse.data?.circulating_supply || 0);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Unable to load data");
        setIsLoading(false);
      }
    };

    fetchData();
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
        <>
          <CurrencyListWithCharts data={pricesData} circulatingSupply={circulatingSupply} />
          <p className="h-24"></p>
          <StablecoinChart data={stablecoinData} />

          <p className="text-base-content text-center">
            <img src="/assets/orcfax.svg" alt="Orcfax" className="w-24 mx-auto" />
            Prices from Orcfax public feed.
          </p>
        </>
      )}
    </div>
  );
};

export default PricesPage;