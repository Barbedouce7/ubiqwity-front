import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EpochContext from '../components/EpochContext';
import EpochChart from '../components/EpochChart';
import ChainUsage from '../components/ChainUsage';
import LatestBlock from '../components/LatestBlock';
import CurrencyListWithCharts from '../components/CurrencyListWithCharts';
import { API_CONFIG } from '../utils/apiConfig';

const HomePage = () => {
  const [apiData, setApiData] = useState([]);
  const [epochContext, setEpochContext] = useState([]);
  const [epochData, setEpochData] = useState([]);
  const [chainUsage, setChainUsage] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chainUsageRes, epochContextRes, epochDataRes, pricesRes] = await Promise.all([
          axios.get(`${API_CONFIG.baseUrl}chainusage/`),
          axios.get(`${API_CONFIG.baseUrl}epochcontext/`),
          axios.get(`${API_CONFIG.baseUrl}epochdata/`),
          axios.get(`${API_CONFIG.baseUrl}last24prices/`)
        ]);

        setChainUsage(chainUsageRes.data[0] || {});
        setEpochContext(epochContextRes.data || []);
        setEpochData(epochDataRes.data || {});
        setApiData(Object.values(pricesRes.data || {}).reverse());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);
return (
  <div className="flex flex-col gap-8 p-1">
    {/* Bloc Chain Usage & Epoch Context */}
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 card bg-base-100 shadow-xl p-4">
        <EpochContext data={epochContext} />
      </div>
      <div className="flex-1 card bg-base-100 shadow-xl p-4">
        {chainUsage && Object.keys(chainUsage).length > 0 ? (
          <ChainUsage data={chainUsage} />
        ) : (
          <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-20"></div>
        )}
      </div>
    </div>

    {/* Bloc Epoch Chart & Latest Block */}
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 card bg-base-100 shadow-xl p-4">
        {epochData ? (
          <EpochChart
            epochLabels={epochData.epochLabels}
            txCounts={epochData.txCounts}
            activeStakes={epochData.activeStakes}
          />
        ) : (
          <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-30"></div>
        )}
      </div>
      <div className="flex-1 card bg-base-100 shadow-xl">
        <LatestBlock />
      </div>
    </div>


      {apiData.length > 0 ? (
        <CurrencyListWithCharts data={apiData} circulatingSupply={epochContext.circulating_supply} />
      ) : (
        <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-30"></div>
      )}
    </div>
);
}

export default HomePage;
