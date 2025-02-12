import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { API_CONFIG } from '../utils/apiConfig';

export const TokenContext = createContext();

export const TokenProvider = ({ children }) => {
  const [tokenMetadata, setTokenMetadata] = useState(() => {
    const savedState = localStorage.getItem('tokenMetadata');
    return savedState ? JSON.parse(savedState) : {
      lovelace: { ticker: "ADA", logo: "/assets/cardano.webp", name: "Cardano" }
    };
  });

  const [loadingTokens, setLoadingTokens] = useState(new Set());
  const [failedTokens, setFailedTokens] = useState(() => {
    const savedFailed = localStorage.getItem('failedTokens');
    if (savedFailed) {
      const parsed = JSON.parse(savedFailed);
      return Object.keys(parsed).reduce((acc, unit) => {
        if (parsed[unit] > Date.now()) acc[unit] = parsed[unit];
        return acc;
      }, {});
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('tokenMetadata', JSON.stringify(tokenMetadata));
    localStorage.setItem('failedTokens', JSON.stringify(failedTokens));
  }, [tokenMetadata, failedTokens]);

  const fetchTokenData = async (unit) => {
    console.log(`🟡 Recherche des métadonnées pour: ${unit}`);

    if (tokenMetadata[unit]) {
      console.log(`✅ Métadonnées trouvées en cache:`, tokenMetadata[unit]);
      return tokenMetadata[unit];
    }

    // Vérification si le token a échoué récemment
    if (failedTokens[unit] && failedTokens[unit] > Date.now()) {
      console.log(`❌ Token ${unit} a échoué récemment, pas de nouvelle tentative.`);
      return { ticker: unit, name: "Unknown Token", decimals: 0 };
    }

    try {
      setLoadingTokens(prev => new Set([...prev, unit]));
      const response = await axios.get(`${API_CONFIG.baseUrl}tokenmetadata/${unit}`);
      console.log("🔹 Réponse API reçue:", response.data);

      const ticker = response.data.ticker || unit;
      const name = response.data.name || "Unknown Token";
      const decimals = response.data.decimals || 0;

      const newMetadata = { ticker, name, decimals };
      console.log(`✅ Données récupérées depuis l'API pour ${unit}:`, newMetadata);

      setTokenMetadata(prev => {
        const updatedMetadata = { ...prev, [unit]: newMetadata };
        localStorage.setItem('tokenMetadata', JSON.stringify(updatedMetadata));
        return updatedMetadata;
      });

      setLoadingTokens(prev => {
        const newSet = new Set(prev);
        newSet.delete(unit);
        return newSet;
      });

      return newMetadata;
    } catch (error) {
      console.error(`❌ Erreur lors du chargement du token ${unit}`, error);
      if (error.response && error.response.status === 404) {
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 heures en millisecondes
        setFailedTokens(prev => ({ ...prev, [unit]: expiryTime }));
      }
      return { ticker: unit, name: "Unknown Token", decimals: 0 };
    }
  };

  return (
    <TokenContext.Provider value={{ tokenMetadata, fetchTokenData }}>
      {children}
    </TokenContext.Provider>
  );
};