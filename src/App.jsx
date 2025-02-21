import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import ThemeToggle from './components/ThemeToggle';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import TransactionPage from './pages/TransactionPage';
import PoolPage from './pages/PoolPage';
import WalletPage from './pages/WalletPage';
import DatumPage from './pages/DatumPage';
import { API_CONFIG } from './utils/apiConfig';
import axios from 'axios';

function App() {
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/' && location.state?.from404) {
      navigate(location.state.from404, { replace: true });
    }
  }, [location, navigate]);

  const handleSearch = async (searchTerm) => {
    let searchUrl = searchTerm.length === 56 ? `/pool/${searchTerm}`
                   : searchTerm.length === 64 ? `/tx/${searchTerm}`
                   : `/wallet/${searchTerm}`;

    try {
      const response = await axios.get(`${API_CONFIG.baseUrl}${searchUrl}`);
      navigate(searchUrl, { state: { data: response.data, from404: searchUrl } });
    } catch (error) {
      console.error("Nothing here... ", error);
      navigate('/', { state: { from404: searchUrl } });
    }
  };

  return (
    <div className="w-full bg-base-100 mx-auto text-center min-h-screen">
      <Navbar handleSearch={handleSearch} setSearchInput={setSearchInput} searchInput={searchInput} />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/tx/:txId" element={<TransactionPage />} />
        <Route path="/pool/:poolId" element={<PoolPage />} />
        <Route path="/wallet/:walletAddress" element={<WalletPage />} />
        <Route path="/datum/:datumHash" element={<DatumPage />} />
      </Routes>
      <Footer />
    </div>
      );
}

export default App;
