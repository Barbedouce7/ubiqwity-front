import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ADAHANDLE_URL = "https://api.handle.me/";

function GetHandle({ stakekey }) {
  const [defaultHandle, setDefaultHandle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchedKey = useRef(null);
  const requestQueue = useRef([]);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!stakekey || lastFetchedKey.current === stakekey) return;

    lastFetchedKey.current = stakekey;
    requestQueue.current.push(stakekey);

    if (!isProcessing.current) {
      processQueue();
    }
  }, [stakekey]);

  const processQueue = () => {
    if (requestQueue.current.length === 0) {
      isProcessing.current = false;
      return;
    }

    isProcessing.current = true;
    const nextKey = requestQueue.current.shift();

    setLoading(true);
    setError(null);

    setTimeout(async () => {
      try {
        const response = await axios.get(`${ADAHANDLE_URL}holders/${nextKey}`);
        if (response.status === 200) {
          setDefaultHandle(response.data.default_handle || null);
        }
      } catch (error) {
        setError("Erreur lors du chargement du handle");
      } finally {
        setLoading(false);
        processQueue();
      }
    }, 500);
  };

  if (loading) return  <div className="animate-spin rounded-full  mx-auto h-6 w-6 border-b-2 border-sky-500"></div>;

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
