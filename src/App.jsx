import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import ThemeToggle from './components/ThemeToggle';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import TransactionPage from './pages/TransactionPage';
import PoolPage from './pages/PoolPage';
import PoolsPage from './pages/PoolsPage';
import PricesPage from './pages/PricesPage';
import WalletPage from './pages/WalletPage';
import DatumPage from './pages/DatumPage';
import CommunityNotesPage from './pages/CommunityNotesPage';
import ProfilPage from './pages/ProfilPage';
import ModerationPage from './pages/ModerationPage';
import { API_CONFIG } from './utils/apiConfig';
import axios from 'axios';
import { useCardano } from '@cardano-foundation/cardano-connect-with-wallet';
import { AuthProvider, useAuth } from './utils/AuthContext';


const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
  const { isAuthenticated, isModerator, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  if (requiredRole === 'moderator' && !isModerator) {
    return <Navigate to="/profil" />;
  }
  
  return children;
};


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
    <AuthProvider>
    <div className="w-full bg-base-100 mx-auto text-center min-h-screen">
      <Navbar handleSearch={handleSearch} setSearchInput={setSearchInput} searchInput={searchInput} />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pools" element={<PoolsPage />} />
        <Route path="/prices" element={<PricesPage />} />
        <Route path="/tx/:txId" element={<TransactionPage />} />
        <Route path="/pool/:poolId" element={<PoolPage />} />
        <Route path="/wallet/:walletAddress" element={<WalletPage />} />
        <Route path="/datum/:datumHash" element={<DatumPage />} />
        <Route path="/communitynotes" element={<CommunityNotesPage />} />
        <Route path="/profil" element={ <ProtectedRoute><ProfilPage /> </ProtectedRoute> }  />
        <Route path="/moderation" element={ <ProtectedRoute requiredRole="moderator"><ModerationPage /></ProtectedRoute> } />
      </Routes>
      <Footer />
    </div>
    </AuthProvider>
      );
}

export default App;
