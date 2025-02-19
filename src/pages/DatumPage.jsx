import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import CopyButton from '../components/CopyButton';

const DatumPage = () => {
  const { datumHash } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = `${API_CONFIG.baseUrl}datum/${datumHash}`;
        console.log(url);
        const response = await axios.get(url);
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [datumHash]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error max-w-2xl mx-auto mt-4">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="shadow-xl">
        <div className="">
          <h2 className="text-base-content">Datum Details</h2>
          <p className="text-sm opacity-70">Hash: {datumHash} <CopyButton text={datumHash} /></p>
          
          
          {/* JSON Content */}
        <div className="p-4 rounded-lg overflow-auto text-left text-base-content bg-base-100 shadow-xl">
            <pre>
              <code>{JSON.stringify(data, null, 2)}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatumPage;