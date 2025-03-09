import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_CONFIG } from '../utils/apiConfig';

export const TokenContext = createContext();

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures
const RETRY_DELAY = 5 * 60 * 1000; // 5 minutes
const DEFAULT_METADATA = { ticker: "", name: "", decimals: 0, logo: 0 };
const BATCH_SIZE = 10; // Taille du lot

export const TokenProvider = ({ children }) => {
  const [tokenMetadata, setTokenMetadata] = useState(() => {
    try {
      const savedState = localStorage.getItem('tokenMetadata');
      return savedState ? JSON.parse(savedState) : {
        lovelace: { ticker: "ADA", logo: "/assets/cardano.webp", name: "Cardano", decimals: 6, policy: 'lovelace' }
      };
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return {
        lovelace: { ticker: "ADA", logo: "/assets/cardano.webp", name: "Cardano", decimals: 6, policy: 'lovelace' }
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
  const [processedHoldings, setProcessedHoldings] = useState({
    tokens: [],
    nftTokens: [],
    fungibleTokens: []
  });

  useEffect(() => {
    try {
      localStorage.setItem('tokenMetadata', JSON.stringify(tokenMetadata));
      localStorage.setItem('failedTokens', JSON.stringify(failedTokens));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [tokenMetadata, failedTokens]);

  const cleanTokenName = (name) => {
    if (!name || name === "null") return null;
    return String(name).replace(/^"(.*)"$/, '$1').trim();
  };

  const splitPolicyAndAsset = (unit) => {
    const policyId = unit.slice(0, 56);
    const assetNameHex = unit.slice(56);
    let assetName = '';
    
    try {
      let i = 0;
      while (i < assetNameHex.length) {
        if (i + 1 >= assetNameHex.length) break;
        const hexPair = assetNameHex.substr(i, 2);
        const charCode = parseInt(hexPair, 16);
        const isValidHex = (hex) => /^[0-9A-Fa-f]+$/.test(hex);
        
        if (!isValidHex(hexPair)) {
          i += 2;
          continue;
        }
        if (charCode >= 32 && charCode <= 126) {
          assetName += String.fromCharCode(charCode);
          i += 2;
          continue;
        }
        if (i + 8 <= assetNameHex.length && assetNameHex.substr(i, 4) === 'f09f') {
          const emojiHex = assetNameHex.substr(i, 8);
          if (isValidHex(emojiHex)) {
            const emojiBytes = new Uint8Array(4);
            for (let j = 0; j < 8; j += 2) {
              emojiBytes[j/2] = parseInt(emojiHex.substr(j, 2), 16);
            }
            try {
              const emojiChar = new TextDecoder('utf-8').decode(emojiBytes);
              if (emojiChar && emojiChar.length === 1) {
                assetName += emojiChar;
                i += 8;
                continue;
              }
            } catch (e) {}
          }
        }
        if (charCode === 0) {
          i += 2;
          continue;
        }
        if (charCode === 0x0d || charCode === 0x0a) {
          assetName += ' ';
          i += 2;
          continue;
        }
        if (charCode > 0x7f) {
          let bytesCount = 0;
          if ((charCode & 0xE0) === 0xC0) bytesCount = 2;
          else if ((charCode & 0xF0) === 0xE0) bytesCount = 3;
          else if ((charCode & 0xF8) === 0xF0) bytesCount = 4;
          if (bytesCount > 0 && i + (bytesCount * 2) <= assetNameHex.length) {
            const utfHex = assetNameHex.substr(i, bytesCount * 2);
            if (isValidHex(utfHex)) {
              const utfBytes = new Uint8Array(bytesCount);
              for (let j = 0; j < bytesCount * 2; j += 2) {
                utfBytes[j/2] = parseInt(utfHex.substr(j, 2), 16);
              }
              try {
                const char = new TextDecoder('utf-8').decode(utfBytes);
                if (char && !char.includes('�')) {
                  assetName += char;
                  i += bytesCount * 2;
                  continue;
                }
              } catch (e) {}
            }
          }
        }
        assetName += '_';
        i += 2;
      }
      assetName = assetName.replace(/_{2,}/g, '_').replace(/^\s+|\s+$/g, '');
    } catch (error) {
      console.warn('Error converting hex to text:', error);
      assetName = assetNameHex;
    }
    return { policyId, assetName };
  };

  const loadIPFSImage = async (ipfsUrl) => {
    if (!ipfsUrl) return null;
    const cid = ipfsUrl.replace('ipfs://', '');
    const gateways = [
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`
    ];
    for (const gatewayUrl of gateways) {
      try {
        const response = await fetch(gatewayUrl, { method: 'HEAD' });
        if (response.ok) return gatewayUrl;
      } catch (err) {
        console.warn(`Failed to load image from ${gatewayUrl}:`, err);
      }
    }
    return gateways[0];
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchTokenData = useCallback(async (unit) => {
    if (tokenMetadata[unit]) return tokenMetadata[unit];
    if (failedTokens[unit] && failedTokens[unit] > Date.now()) return DEFAULT_METADATA;
    if (pendingRequests.has(unit)) return pendingRequests.get(unit);

    const promise = (async () => {
      try {
        const response = await axios.get(
          `${API_CONFIG.baseUrl}tokenmetadata/${unit}`,
          { timeout: 5000, retries: 1 }
        );
        
        const { assetName } = splitPolicyAndAsset(unit);
        const fallbackName = cleanTokenName(assetName) || "Unknown Token";

        const newMetadata = {
          ticker: cleanTokenName(response.data.ticker) || unit,
          name: cleanTokenName(response.data.name) || fallbackName,
          decimals: response.data.decimals || 0,
          policy: unit,
          logo: response.data.logo || 0,
          onchainMetadata: response.data.onchain_metadata
        };
        setTokenMetadata(prev => ({ ...prev, [unit]: newMetadata }));
        return newMetadata;
      } catch (error) {
        const { assetName } = splitPolicyAndAsset(unit);
        const fallbackName = cleanTokenName(assetName) || "Unknown Token";
        
        const isNetworkError = error.code === 'ERR_NETWORK' || 
                             error.code === 'ECONNABORTED' ||
                             error.message === 'Network Error';
        const retryTime = isNetworkError ? Date.now() + RETRY_DELAY : Date.now() + CACHE_DURATION;
        setFailedTokens(prev => ({ ...prev, [unit]: retryTime }));
        return { ...DEFAULT_METADATA, name: fallbackName, policy: unit };
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

  const processHoldings = useCallback(async (holdingsData) => {
    if (!holdingsData?.holdings?.length) {
      setProcessedHoldings({ tokens: [], nftTokens: [], fungibleTokens: [] });
      return { tokens: [], nftTokens: [], fungibleTokens: [] };
    }

    const mergedTokens = holdingsData.holdings.reduce((acc, holding) => {
      if (holding.unit === "lovelace") return acc;
      const quantity = BigInt(holding.quantity);
      if (acc[holding.unit]) {
        acc[holding.unit].quantity += quantity;
      } else {
        acc[holding.unit] = { ...holding, quantity };
      }
      return acc;
    }, {});

    const tokenList = Object.values(mergedTokens);
    let allTokens = [];
    let allNftTokens = [];
    let allFungibleTokens = [];

    for (let i = 0; i < tokenList.length; i += BATCH_SIZE) {
      const batch = tokenList.slice(i, i + BATCH_SIZE);
      const initialTokens = await Promise.all(
        batch.map(async (holding, index) => {
          await delay(Math.min(index * 10, 100));
          const { policyId, assetName } = splitPolicyAndAsset(holding.unit);
          return {
            unit: holding.unit,
            quantity: Number(holding.quantity),
            decimals: 0,
            policyId,
            assetName,
            hasMetadata: false,
            isNFT: Number(holding.quantity) === 1,
            isLoadingMetadata: true
          };
        })
      );

      const processedBatch = await Promise.all(
        initialTokens.map(async (token) => {
          try {
            const metadata = await fetchTokenData(token.unit);
            let logoUrl = null;
            let imageUrl = null;

            if (metadata?.logo === 1) {
              const imgUrl = `/tokenimages/${token.unit}.png`;
              try {
                const response = await fetch(imgUrl, { method: 'HEAD' });
                if (response.ok) logoUrl = imgUrl;
              } catch (error) {}
            }

            if (token.isNFT && metadata?.onchainMetadata?.image) {
              const imageSource = metadata.onchainMetadata.image;
              if (imageSource?.startsWith('ipfs://')) {
                imageUrl = await loadIPFSImage(imageSource);
              }
            }

            const cleanName = cleanTokenName(metadata?.name) || 
                            cleanTokenName(token.assetName) || 
                            "Unknown Token";

            return {
              ...token,
              decimals: metadata?.decimals || 0,
              name: cleanName,
              ticker: cleanTokenName(metadata?.ticker) || token.assetName,
              logo: logoUrl,
              hasMetadata: !!metadata,
              onchainMetadata: metadata?.onchainMetadata,
              imageUrl,
              isLoadingMetadata: false
            };
          } catch (error) {
            console.error(`Error processing token ${token.unit}:`, error);
            const fallbackName = cleanTokenName(token.assetName) || "Unknown Token";
            return { 
              ...token, 
              name: fallbackName,
              isLoadingMetadata: false 
            };
          }
        })
      );

      const validBatch = processedBatch.filter(Boolean).sort((a, b) => {
        if (a.isNFT && b.isNFT) return (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0);
        if (a.hasMetadata !== b.hasMetadata) return b.hasMetadata ? 1 : -1;
        return (b.logo ? 1 : 0) - (a.logo ? 1 : 0);
      });

      allTokens = [...allTokens, ...validBatch];
      allNftTokens = allTokens.filter(token => token.isNFT);
      allFungibleTokens = allTokens.filter(token => !token.isNFT);

      setProcessedHoldings({
        tokens: allTokens,
        nftTokens: allNftTokens,
        fungibleTokens: allFungibleTokens
      });

      if (i + BATCH_SIZE < tokenList.length) {
        await delay(50);
      }
    }

    return {
      tokens: allTokens,
      nftTokens: allNftTokens,
      fungibleTokens: allFungibleTokens
    };
  }, [fetchTokenData]);

  return (
    <TokenContext.Provider value={{ 
      tokenMetadata, 
      fetchTokenData,
      processHoldings,
      processedHoldings,
      isFailedToken: (unit) => failedTokens[unit] && failedTokens[unit] > Date.now()
    }}>
      {children}
    </TokenContext.Provider>
  );
};