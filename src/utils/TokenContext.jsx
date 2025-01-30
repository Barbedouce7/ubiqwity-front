import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const TokenContext = createContext();

export const TokenProvider = ({ children }) => {
  const [tokenMetadata, setTokenMetadata] = useState({
    ADA: { ticker: "ADA", logo: "/assets/cardano.webp" }, // Stocke ADA par défaut
  });

  const fetchTokenData = async (unit) => {
    if (tokenMetadata[unit]) return tokenMetadata[unit]; // Retourne depuis le cache si déjà récupéré

    try {
      const response = await axios.get(`https://tokens.cardano.org/metadata/${unit}`);
      const ticker = response.data.ticker?.value || unit;
      const logo = response.data.logo?.value || null;

      const newMetadata = { ticker, logo };
      setTokenMetadata((prev) => ({ ...prev, [unit]: newMetadata })); // Met en cache
      console.log(newMetadata)
      return newMetadata;
    } catch (error) {
      console.error(`Erreur lors du chargement du token ${unit}`, error);
      return { ticker: unit, logo: null };
    }
  };

  return (
    <TokenContext.Provider value={{ tokenMetadata, fetchTokenData }}>
      {children}
    </TokenContext.Provider>
  );
};
