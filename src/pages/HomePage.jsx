import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EpochContext from '../components/EpochContext';
import EpochChart from '../components/EpochChart';
import ChainUsage from '../components/ChainUsage';
import LatestBlock from '../components/LatestBlock';
import { API_CONFIG } from '../utils/apiConfig';

const HomePage = () => {
  const [epochContext, setEpochContext] = useState([]);
  const [epochData, setEpochData] = useState(null);
  const [chainUsage, setChainUsage] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chainUsageRes, epochContextRes, epochDataRes] = await Promise.all([
          axios.get(`${API_CONFIG.baseUrl}chainusage/`),
          axios.get(`${API_CONFIG.baseUrl}epochcontext/`),
          axios.get(`${API_CONFIG.baseUrl}epochdata/`)
        ]);
        
        setChainUsage(chainUsageRes.data[0] || {});
        setEpochContext(epochContextRes.data || []);
        setEpochData(epochDataRes.data || null);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data");
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-1">
        <div className="rounded-xl shadow-xl p-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-1">
      {/* Bloc Chain Usage & Epoch Context */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 rounded-xl shadow-xl p-4">
          {!isLoading ? (
            <EpochContext data={epochContext} />
          ) : (
            <div className="flex justify-center items-center min-h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
            </div>
          )}
        </div>
        <div className="flex-1 rounded-xl shadow-xl p-4">
          {chainUsage && Object.keys(chainUsage).length > 0 ? (
            <ChainUsage data={chainUsage} />
          ) : (
            <div className="flex justify-center items-center min-h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bloc Epoch Chart & Latest Block */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 rounded-xl shadow-xl p-4">
          {epochData ? (
            <EpochChart
              epochLabels={epochData.epochLabels}
              txCounts={epochData.txCounts}
              activeStakes={epochData.activeStakes}
            />
          ) : (
            <div className="flex justify-center items-center min-h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
            </div>
          )}
        </div>
        <div className="flex-1 rounded-xl shadow-xl">
          <LatestBlock />
        </div>
      </div>
    </div>
  );
};

export default HomePage;