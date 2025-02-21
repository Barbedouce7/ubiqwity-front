import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useSearchParams } from 'react-router-dom';
import { FormatNumberWithSpaces } from '../utils/FormatNumberWithSpaces';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { shortener, convertLovelaceToAda } from '../utils/utils';

const SaturationBar = ({ saturation }) => {
  if (saturation === null || saturation === undefined || isNaN(saturation)) {
    return null;
  }
  const percentage = (saturation * 100).toFixed(1);
  
  // Déterminer la couleur en fonction du niveau de saturation
  const getColor = () => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  // Limiter la largeur de la barre à 100% maximum pour l'affichage
  const displayWidth = Math.min(percentage, 100);

  return (
    <div className="w-full">
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-300`} 
          style={{ width: `${displayWidth}%` }}
        />
      </div>
      <div className="text-sm mt-1 text-right">{percentage}%</div>
    </div>
  );
};

function PoolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [poolsData, setPoolsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const page = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sort') || 'live_stake';
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchPoolsData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_CONFIG.baseUrl}pools`, {
          params: { 
            sort: sortBy,
            order: sortOrder,
            page,
            limit: 100
          }
        });

        const { data, pagination } = response.data;
        
        setPoolsData(data);
        setTotalPages(pagination.pages);
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
      setSearchParams({ page: '1', sort: newSortBy });
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ page: newPage.toString(), sort: sortBy });
    }
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
                  <th className="px-4 py-2">Ticker & Name</th>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('live_stake')}>
                    Live Stake {sortBy === 'live_stake' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('active_stake')}>
                    Active Stake {sortBy === 'active_stake' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('live_delegators')}>
                    Delegators {sortBy === 'live_delegators' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort('blocks_minted')}>
                    Blocks {sortBy === 'blocks_minted' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-4 py-2 cursor-pointer w-40" onClick={() => handleSort('live_saturation')}>
                    Saturation {sortBy === 'live_saturation' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {poolsData.map((pool) => (
                  <tr key={pool.pool_id} className="border-t">
                    <td className="px-4 py-2"><Link to={`/pool/${pool.pool_id}`} className="text-sky-500 underline">{pool.ticker || shortener(pool.pool_id)}</Link><br />{pool.name || ''} </td>
                    <td className="px-4 py-2">{convertLovelaceToAda(pool.live_stake)} ₳</td>
                    <td className="px-4 py-2">{convertLovelaceToAda(pool.active_stake)} ₳</td>
                    <td className="px-4 py-2">{pool.live_delegators}</td>
                    <td className="px-4 py-2">{pool.blocks_minted}</td>
                    <td className="px-4 py-2">
                      <SaturationBar saturation={pool.live_saturation} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <PaginationControls /><p>100 pool / page</p>
          </div>
        </>
      )}
    </div>
  );
}

export default PoolsPage;