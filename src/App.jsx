import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import EpochContext from './EpochContext';
import EpochChart from './EpochChart';
import ChainUsage from './ChainUsage';
import CurrencyListWithCharts from './CurrencyListWithCharts';
import axios from 'axios';
import TransactionPage from './TransactionPage';
import PoolPage from './PoolPage';
import WalletPage from './WalletPage';
import { API_CONFIG } from './apiConfig';

function App() {
  const [apiData, setApiData] = useState([]);
  const [epochContext, setEpochContext] = useState([]);
  const [epochData, setEpochData] = useState([]);
  const [chainUsage, setChainUsage] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Effect for fetching data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const responseChainUsage = await axios.get(`${API_CONFIG.baseUrl}chainusage/`);
        setChainUsage(responseChainUsage.data[0]);

        const responseEpochContext = await axios.get(`${API_CONFIG.baseUrl}epochcontext/`);
        setEpochContext(responseEpochContext.data);

        const response = await axios.get(`${API_CONFIG.baseUrl}last24prices/`);
        const dataArray = Object.values(response.data); // Convertir l'objet en tableau
        const reversedData = dataArray.reverse();
        setApiData(reversedData);

        const response2 = await axios.get(`${API_CONFIG.baseUrl}epochdata/`);
        setEpochData(response2.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Effect for handling 404 redirect
  useEffect(() => {
      if (location.pathname === '/' && location.state && location.state.from404) {
        navigate(location.state.from404, { replace: true });
      }
    }, [location, navigate]);

  const handleSearch = async (searchTerm) => {
    let searchUrl = '', data;

    if (searchTerm.length === 56) {
      searchUrl = `/pool/${searchTerm}`;
    } else if (searchTerm.length === 64) {
      searchUrl = `/tx/${searchTerm}`;
    } else {
      searchUrl = `/wallet/${searchTerm}`;
    }

    try {
      const response = await axios.get(`${API_CONFIG.baseUrl}${searchUrl}`);
      data = response.data;
      navigate(searchUrl, { state: { data, from404: searchUrl } });  
    } catch (error) {
      console.error("Nothing here... ", error);
      // Optionally, navigate to a 404 page within your app or back to home
      navigate('/', { state: { from404: searchUrl } });
    }
  };

  return (
    <div className="w-full mx-auto text-center p-2">
      <Navbar handleSearch={handleSearch} setSearchInput={setSearchInput} searchInput={searchInput} />

      <Routes>
        <Route path="/" element={
          <>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                {chainUsage && Object.keys(chainUsage).length > 0 ? (
                  <ChainUsage data={chainUsage} />
                ) : (
                  <p>Loading ...</p>
                )}
                <EpochContext data={epochContext} />
              </div>

              <div className="mt-4 mb-4 md:max-w-full flex-1">
                {epochData ? (
                  <EpochChart epochLabels={epochData.epochLabels} txCounts={epochData.txCounts} activeStakes={epochData.activeStakes} />
                ) : (
                  <p>Loading...</p>
                )}
              </div>
            </div>
            {apiData.length > 0 ? (
              <CurrencyListWithCharts data={apiData} />
            ) : (
              <p>Loading...</p>
            )}
          </>
        } />
        <Route path="/tx/:txId" element={<TransactionPage />} />
        <Route path="/pool/:poolId" element={<PoolPage />} />
        <Route path="/wallet/:walletAddress" element={<WalletPage />} />
      </Routes>
    </div>
  );
}

export default App;