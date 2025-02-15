import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_CONFIG } from '../utils/apiConfig';

export const TokenContext = createContext();

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures
const RETRY_DELAY = 5 * 60 * 1000; // 5 minutes
const DEFAULT_METADATA = { ticker: "", name: "", decimals: 0, logo: 0 };

export const TokenProvider = ({ children }) => {
  const [tokenMetadata, setTokenMetadata] = useState(() => {
    try {
      const savedState = localStorage.getItem('tokenMetadata');
      return savedState ? JSON.parse(savedState) : {
        lovelace: { ticker: "ADA", logo: "/assets/cardano.webp", name: "Cardano", decimals : 6, policy: 'lovelace' }
      };
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return {
        lovelace: { ticker: "ADA", logo: "/assets/cardano.webp", name: "Cardano", decimals : 6, policy: 'lovelace' }
      };
    }
  });

  const [failedTokens, setFailedTokens] = useState(() => {
    try {
      const savedFailed = localStorage.getItem('failedTokens');
      if (savedFailed) {
        const parsed = JSON.parse(savedFailed);
        return Object.entries(parsed).reduce((acc, [unit, timestamp]) => {
          if (timestamp > Date.now()) acc[unit] = timestamp;
          return acc;
        }, {});
      }
      return {};
    } catch (error) {
      console.error("Error loading failed tokens:", error);
      return {};
    }
  });

  const [pendingRequests, setPendingRequests] = useState(new Map());

  useEffect(() => {
    try {
      localStorage.setItem('tokenMetadata', JSON.stringify(tokenMetadata));
      localStorage.setItem('failedTokens', JSON.stringify(failedTokens));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [tokenMetadata, failedTokens]);

  const fetchTokenData = useCallback(async (unit) => {
    // Retourner les métadonnées en cache si disponibles
    if (tokenMetadata[unit]) {
      return tokenMetadata[unit];
    }

    // Vérifier si le token a échoué récemment
    if (failedTokens[unit] && failedTokens[unit] > Date.now()) {
      return DEFAULT_METADATA;
    }

    // Vérifier si une requête est déjà en cours pour ce token
    if (pendingRequests.has(unit)) {
      return pendingRequests.get(unit);
    }

    // Créer une nouvelle promesse pour ce token
    const promise = (async () => {
      try {
        const response = await axios.get(
          `${API_CONFIG.baseUrl}tokenmetadata/${unit}`,
          { 
            timeout: 5000,
            retries: 1
          }
        );

        const newMetadata = {
          ticker: response.data.ticker || unit,
          name: response.data.name || "No name",
          decimals: response.data.decimals || 0,
          policy: unit,
          logo: response.data.logo || 0,
        };

        setTokenMetadata(prev => ({
          ...prev,
          [unit]: newMetadata
        }));

        return newMetadata;
      } catch (error) {
        const isNetworkError = error.code === 'ERR_NETWORK' || 
                             error.code === 'ECONNABORTED' ||
                             error.message === 'Network Error';

        const retryTime = isNetworkError ? 
          Date.now() + RETRY_DELAY : 
          Date.now() + CACHE_DURATION;

        setFailedTokens(prev => ({
          ...prev,
          [unit]: retryTime
        }));

        return DEFAULT_METADATA;
      } finally {
        setPendingRequests(prev => {
          const newMap = new Map(prev);
          newMap.delete(unit);
          return newMap;
        });
      }
    })();

    setPendingRequests(prev => new Map([...prev, [unit, promise]]));
    return promise;
  }, [tokenMetadata, failedTokens, pendingRequests]);

  //console.log(tokenMetadata)
  return (
    <TokenContext.Provider value={{ 
      tokenMetadata, 
      fetchTokenData,
      isFailedToken: (unit) => failedTokens[unit] && failedTokens[unit] > Date.now()
    }}>
      {children}
    </TokenContext.Provider>
  );
};