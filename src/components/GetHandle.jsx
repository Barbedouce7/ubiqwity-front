import React, { useState, useEffect } from "react";
import axios from "axios";

const ADAHANDLE_URL = "https://api.handle.me/";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
const REQUEST_DELAY = 500; // Délai de 500ms entre les requêtes

// Variables statiques (partagées entre toutes les instances du composant)
// Utilisées pour contrôler les délais entre requêtes
let lastRequestTime = 0;
let requestQueue = [];
let isProcessingQueue = false;

// Clé de cache pour localStorage
const getCacheKey = (stakekey) => `adahandle_cache_${stakekey}`;

function GetHandle({ stakekey }) {
  const [defaultHandle, setDefaultHandle] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fonction pour vérifier le cache
  const checkCache = (key) => {
    try {
      const cacheKey = getCacheKey(key);
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, timestamp, status } = JSON.parse(cachedData);
        
        // Vérifier si le cache est encore valide
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log(`Utilisation du cache pour ${key}, status: ${status}`);
          
          if (status === 404 || status === 200) {
            return { 
              found: true, 
              handle: status === 200 ? data : null,
              status
            };
          }
        } else {
          // Cache expiré, supprimer
          localStorage.removeItem(cacheKey);
        }
      }
      return { found: false };
    } catch (error) {
      console.error("Erreur lors de la vérification du cache:", error);
      return { found: false };
    }
  };

  // Fonction pour traiter la file d'attente avec délai
  const processRequestQueue = () => {
    if (isProcessingQueue || requestQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    const processNext = async () => {
      if (requestQueue.length === 0) {
        isProcessingQueue = false;
        return;
      }
      
      const now = Date.now();
      const timeToWait = Math.max(0, (lastRequestTime + REQUEST_DELAY) - now);
      
      setTimeout(async () => {
        const { key, setHandleFn, setLoadingFn } = requestQueue.shift();
        
        // Double vérification du cache avant la requête
        const cachedResult = checkCache(key);
        if (cachedResult.found) {
          setHandleFn(cachedResult.handle);
          setLoadingFn(false);
          processNext();
          return;
        }
        
        lastRequestTime = Date.now();
        console.log(`Requête API pour ${key} à ${new Date(lastRequestTime).toLocaleTimeString()}`);
        
        try {
          const response = await axios.get(`${ADAHANDLE_URL}holders/${key}`);
          
          // Enregistrer dans le cache
          try {
            localStorage.setItem(
              getCacheKey(key),
              JSON.stringify({
                data: response.data.default_handle || null,
                status: 200,
                timestamp: Date.now()
              })
            );
          } catch (e) {
            console.error("Erreur lors de l'enregistrement dans le cache:", e);
          }
          
          setHandleFn(response.data.default_handle || null);
        } catch (error) {
          console.error(`Erreur pour ${key}:`, error.response?.status || error.message);
          
          // Si c'est un 404, on le met en cache aussi
          if (error.response && error.response.status === 404) {
            try {
              localStorage.setItem(
                getCacheKey(key),
                JSON.stringify({
                  data: null,
                  status: 404,
                  timestamp: Date.now()
                })
              );
            } catch (e) {
              console.error("Erreur lors de l'enregistrement du 404 dans le cache:", e);
            }
          }
          
          setHandleFn(null);
        } finally {
          setLoadingFn(false);
          processNext(); // Traiter la prochaine requête
        }
      }, timeToWait);
    };
    
    processNext();
  };

  useEffect(() => {
    // Ne rien faire si pas de stakekey
    if (!stakekey) return;

    // Vérifier d'abord le cache
    const cachedResult = checkCache(stakekey);
    if (cachedResult.found) {
      setDefaultHandle(cachedResult.handle);
      return;
    }

    // Si pas en cache, ajouter à la file d'attente
    setLoading(true);
    requestQueue.push({
      key: stakekey,
      setHandleFn: setDefaultHandle,
      setLoadingFn: setLoading
    });
    
    // Démarrer le traitement de la file si pas déjà en cours
    processRequestQueue();
    
  }, [stakekey]);

  // Nettoyage lors du démontage du composant
  useEffect(() => {
    return () => {
      // Retirer cet élément de la file d'attente s'il y est
      requestQueue = requestQueue.filter(item => item.setHandleFn !== setDefaultHandle);
    };
  }, []);

  // Affichage du résultat
  return (
    <p className="text-lg">
      {defaultHandle ? (
        <>
          <span className="bg-slate-800 text-gray-100 w-auto inline-block rounded-lg pl-2 pr-2 pt-1 pb-1">
            <span className="text-green-500">$</span>
            {defaultHandle}
          </span>
        </>
      ) : (
        <span className="text-gray-500"></span>
      )}
    </p>
  );
}

export default GetHandle;