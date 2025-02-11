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

  useEffect(() => {
    localStorage.setItem('tokenMetadata', JSON.stringify(tokenMetadata));
  }, [tokenMetadata]);

const fetchTokenData = async (unit) => {
  console.log(`🟡 Recherche des métadonnées pour: ${unit}`);

  if (tokenMetadata[unit]) {
    console.log(`✅ Métadonnées trouvées en cache:`, tokenMetadata[unit]);
    return tokenMetadata[unit]; // Retourne ce qui est en mémoire
  }

  try {
    const response = await axios.get(`${API_CONFIG.baseUrl}tokenmetadata/${unit}`);
    console.log("🔹 Réponse API reçue:", response.data);

    // Correction : on prend directement les valeurs sans `.value`
    const ticker = response.data.ticker || unit;
    const logo = response.data.logo || null;
    const name = response.data.name || "Unknown Token";
    const decimals = response.data.decimals || 0;

    const newMetadata = { ticker, logo, name, decimals };
    console.log(`✅ Données récupérées depuis l'API pour ${unit}:`, newMetadata);

    // Mise à jour du contexte et localStorage
    setTokenMetadata(prev => {
      const updatedMetadata = { ...prev, [unit]: newMetadata };
      localStorage.setItem('tokenMetadata', JSON.stringify(updatedMetadata));
      return updatedMetadata;
    });

    return newMetadata;
  } catch (error) {
    console.error(`❌ Erreur lors du chargement du token ${unit}`, error);
    return { ticker: unit, logo: null, name: "Unknown Token", decimals: 0 };
  }
};


  return (
    <TokenContext.Provider value={{ tokenMetadata, fetchTokenData }}>
      {children}
    </TokenContext.Provider>
  );
};
