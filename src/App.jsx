import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import ThemeToggle from './components/ThemeToggle';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import TransactionPage from './pages/TransactionPage';
import AssetPage from './pages/AssetPage';
import PoolPage from './pages/PoolPage';
import PoolsPage from './pages/PoolsPage';
import DRepsPage from './pages/DRepsPage';
import ProposalPage from './pages/ProposalPage';
import ProposalsPage from './pages/ProposalsPage';
import PricesPage from './pages/PricesPage';
import WalletPage from './pages/WalletPage';
import DRepPage from './pages/DRepPage';
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
    // Vérifie si le terme commence par stake, addr, ae, ddz ou drep
    const walletPrefixes = /^(stake|addr|ae|ddz)/i;
    const termLength = searchTerm.length;
    
    // Conditions pour wallet en priorité
    let searchUrl;
    if (searchTerm.startsWith('drep')) {
        searchUrl = `/drep/${searchTerm}`;
    } else if(searchTerm.startsWith('pool')) {
        searchUrl = `/pool/${searchTerm}`;
    } else if (
        walletPrefixes.test(searchTerm) ||        // Commence par stake, addr, ae ou ddz
        termLength < 20 ||                        // Moins de 20 caractères
        termLength === 103 ||                     // Exactement 103 caractères
        termLength === 64                         // Garder la condition existante pour tx
    ) {
       if (termLength === 64) {
            searchUrl = `/tx/${searchTerm}`;
        } else {
            searchUrl = `/wallet/${searchTerm}`;
        }
    } else {
        searchUrl = `/asset/${searchTerm}`;
    }
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
        <Route path="/asset/:asset" element={<AssetPage />} />
        <Route path="/pool/:poolId" element={<PoolPage />} />
        <Route path="/drep/:drepId" element={<DRepPage />} />
        <Route path="/dreps" element={<DRepsPage />} />
        <Route path="/proposal/:txHash/:certIndex?" element={<ProposalPage />} />
        <Route path="/proposals" element={<ProposalsPage />} />
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
