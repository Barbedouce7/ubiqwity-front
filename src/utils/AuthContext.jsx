import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';

// Utilitaires pour les cookies
const setCookie = (name, value, days) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const token = getCookie('authToken');
      console.log('Token envoyé:', token);
      const userResponse = await axios.get(`${API_CONFIG.baseUrl}profil`, { 
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined, // Toujours envoyer via Authorization
        },
        validateStatus: (status) => true
      });
      console.log('Requête /profil - Statut:', userResponse.status);
      console.log('Requête /profil - Réponse:', userResponse.data);

      const authenticated = userResponse.status === 200;
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const modResponse = await axios.get(`${API_CONFIG.baseUrl}moderation`, { 
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          validateStatus: (status) => true
        });
        setIsModerator(modResponse.status === 200);
      } else {
        setIsModerator(false);
      }
    } catch (error) {
      console.error('Auth check error:', error.response?.status, error.response?.data);
      setIsAuthenticated(false);
      setIsModerator(false);
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWallet = async (stakeAddress, signature, message) => {
    try {
      const response = await axios.post(`${API_CONFIG.baseUrl}login`, 
        { stakeAddress, signature, message },
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true // Garder pour récupérer le cookie initial si nécessaire
        }
      );
      
      if (response.status === 200) {
        console.log('Login response data:', response.data);
        
        // Supposons que le token est dans response.data.token
        const token = response.data.token || response.data.accessToken; // Ajuste selon la structure
        if (token) {
          setCookie('authToken', token, 7); // Stocker le token
          console.log('Token stocké:', getCookie('authToken'));
        } else {
          console.warn('Aucun token trouvé dans la réponse de /login');
        }
        
        await checkAuthStatus();
        return { success: true, message: response.data.message || 'Authentication successful' };
      }
      
      return { success: false, message: 'Authentication failed' };
    } catch (error) {
      console.error('Authentication error:', error.response?.status, error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Authentication failed' 
      };
    }
  };

  const logout = async () => {
    try {
      const token = getCookie('authToken');
      await axios.post(`${API_CONFIG.baseUrl}logout`, {}, { 
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        withCredentials: true
      });
      setCookie('authToken', '', -1); // Supprimer le cookie
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setIsModerator(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    isAuthenticated,
    isModerator,
    isLoading,
    authenticateWallet,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};