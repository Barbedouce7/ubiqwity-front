import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useSearchParams } from 'react-router-dom';
import { FormatNumberWithSpaces } from '../utils/FormatNumberWithSpaces';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { shortener, convertLovelaceToAda } from '../utils/utils';

function PoolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [poolsData, setPoolsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [showRawResponse, setShowRawResponse] = useState(false);

  const page = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sortBy') || 'live_stake';
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchPoolsData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}pools`, {
          params: { page, sortBy, order: sortOrder }
        });

        const data = response.data;
        console.log('API Response:', data);

        let poolsArray = Array.isArray(data.data) ? data.data : [];

        // Correction du tri numérique
        poolsArray.sort((a, b) => {
          const valueA = Number(a[sortBy]) || 0;
          const valueB = Number(b[sortBy]) || 0;
          return sortOrder === 'desc' ? valueB - valueA : valueA - valueB;
        });

        setPoolsData(poolsArray);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        console.error('API Error:', err.response || err);
        setError(`Failed to load pools: ${err.message}`);
        setPoolsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPoolsData();
  }, [page, sortBy, sortOrder]);

  const handleSort = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSearchParams({ page: '1', sortBy: newSortBy });
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage.toString(), sortBy });
  };

  const PaginationControls = () => (
    <div className="flex justify-center items-center gap-2">
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-2 rounded disabled:opacity-50"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <span>{page} of {totalPages}</span>
      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className="px-4 py-2 rounded disabled:opacity-50"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );

  if (loading) return <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40 mb-40"></div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">Pools</h1>
      <PaginationControls />

      {poolsData.length === 0 ? (
        <div className="mt-4">No valid pool data available yet...</div>
      ) : (
        <>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-grey-500/50 rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2">Pool ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('live_stake')}>
                    Live Stake {sortBy === 'live_stake' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('active_stake')}>
                    Active Stake {sortBy === 'active_stake' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {poolsData.map((pool) => (
                  <tr key={pool.pool_id} className="border-t">
                    <td className="px-4 py-2"> 
                      <Link to={`/pool/${pool.pool_id || ""}`} className="text-sky-500 underline">
                        {shortener(pool.pool_id) || '-'}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{pool.name || '-'}</td>
                    <td className="px-4 py-2">{convertLovelaceToAda(pool.live_stake)} ₳</td>
                    <td className="px-4 py-2">{convertLovelaceToAda(pool.active_stake)} ₳</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <PaginationControls />
          </div>
        </>
      )}
{/*}
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => setShowRawResponse(!showRawResponse)}
      >
        {showRawResponse ? 'Masquer la réponse API' : 'Afficher la réponse API'}
      </button>
      {showRawResponse && (
        <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
          {JSON.stringify({ data: poolsData, totalPages }, null, 2)}
        </pre>
      )}

      */}
    </div>
  );
}

export default PoolsPage;
