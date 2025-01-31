import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ADAHANDLE_URL = "https://api.handle.me/";

function GetHandle({ stakekey }) {
  const [defaultHandle, setDefaultHandle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchedKey = useRef(null); // Stocke la dernière clé récupérée pour éviter des requêtes inutiles

  useEffect(() => {
    if (!stakekey || lastFetchedKey.current === stakekey) return;

    lastFetchedKey.current = stakekey; // Marque cette clé comme récupérée pour éviter les boucles

    const fetchHandle = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${ADAHANDLE_URL}holders/${stakekey}`);
        if (response.status === 200) {
          setDefaultHandle(response.data.default_handle || null);
        }
      } catch (error) {
        setError("Erreur lors du chargement du handle");
      } finally {
        setLoading(false);
      }
    };

    fetchHandle();
  }, [stakekey]);

  if (loading) return <p className="text-sm text-gray-500">Handle Loading...</p>;


  return (
    <p className="text-lg">
      {defaultHandle ? (
        <>
          <span className="text-green-500">$</span>
          {defaultHandle}
        </>
      ) : (
        <span className="text-gray-500"></span>
      )}
    </p>
  );
}

export default GetHandle;
