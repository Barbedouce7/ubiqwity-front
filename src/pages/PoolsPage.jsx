import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { shortener, convertLovelaceToAda } from '../utils/utils';

const SaturationBar = ({ saturation }) => {
  if (saturation === null || saturation === undefined || isNaN(saturation)) {
    return null;
  }
  const percentage = (saturation * 100).toFixed(1);
  
  const getColor = () => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

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
  const [totalResults, setTotalResults] = useState(0);
  
  // État local pour le champ de recherche
  const [inputTicker, setInputTicker] = useState(searchParams.get('ticker') || '');
  // Délai de debounce pour la recherche
  const searchTimeout = useRef(null);

  const page = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sort') || 'live_stake';
  const searchTicker = searchParams.get('ticker') || '';
  const [sortOrder, setSortOrder] = useState('desc');

  // Fonction de fetch des données
  const fetchPoolsData = async (params) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.baseUrl}pools`, {
        params: {
          sort: params.sortBy,
          order: params.sortOrder,
          page: params.page,
          limit: 100,
          ticker: params.searchTicker || undefined
        }
      });

      if (!response.data || response.data.status !== 'success' || !response.data.pagination) {
        console.error('Invalid API structure:', response.data);
        throw new Error(response.data?.message || 'Invalid API response');
      }

      const { data, pagination } = response.data;
      setPoolsData(data || []);
      setTotalPages(pagination.pages || 1);
      setTotalResults(pagination.total || 0);
    } catch (err) {
      console.error('API Error:', err.response || err);
      setError(`Failed to load pools: ${err.message}`);
      setPoolsData([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données initiales et lors des changements de page/tri
  useEffect(() => {
    fetchPoolsData({
      sortBy,
      sortOrder,
      page,
      searchTicker
    });
  }, [page, sortBy, sortOrder, searchTicker]);

  const handleSort = (newSortBy) => {
    if (newSortBy === sortBy) {
      const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
      setSortOrder(newOrder);
      
      // Mettre à jour les données avec le nouvel ordre
      fetchPoolsData({
        sortBy,
        sortOrder: newOrder,
        page,
        searchTicker
      });
    } else {
      setSearchParams({ 
        page: '1', 
        sort: newSortBy,
        ...(searchTicker && { ticker: searchTicker })
      });
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ 
        page: newPage.toString(), 
        sort: sortBy,
        ...(searchTicker && { ticker: searchTicker })
      });
    }
  };

  // Gestion des changements dans le champ de recherche avec debounce
  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setInputTicker(newValue);
    
    // Annuler le timeout précédent si existe
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Définir un nouveau timeout
    searchTimeout.current = setTimeout(() => {
      // Mettre à jour l'URL et déclencher la recherche
      setSearchParams({
        page: '1',
        sort: sortBy,
        ...(newValue && { ticker: newValue })
      });
    }, 500); // Délai de 500ms avant déclenchement de la recherche
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

  // Fonction pour générer les lignes de tableau pour le chargement
  const renderSkeletonRows = () => {
    return Array(10).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="border-t animate-pulse">
        <td className="px-4 py-2 w-1/4">
          <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </td>
        <td className="px-4 py-2 w-1/5">
          <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="px-4 py-2 w-1/8">
          <div className="h-5 bg-gray-200 rounded w-12"></div>
        </td>
        <td className="px-4 py-2 w-1/8">
          <div className="h-5 bg-gray-200 rounded w-12"></div>
        </td>
        <td className="px-4 py-2 w-1/4">
          <div className="h-4 bg-gray-200 rounded-full w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-10 ml-auto"></div>
        </td>
      </tr>
    ));
  };

  // État d'erreur
  if (error) {
    return (
      <div className="container mx-auto p-4 text-base-content">
        <h1 className="text-2xl font-bold mb-4">Pools</h1>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Styles pour les en-têtes de colonnes
  const columnStyles = {
    tickerColumn: "w-1/4 min-w-[200px]",
    stakeColumn: "w-1/5 min-w-[160px]",
    delegatorsColumn: "w-1/8 min-w-[100px]",
    blocksColumn: "w-1/8 min-w-[100px]",
    saturationColumn: "w-1/4 min-w-[160px]"
  };

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">Pools</h1>
      
      <div className="mb-2">
        <input
          type="text"
          value={inputTicker}
          onChange={handleSearchChange}
          placeholder="Search by ticker (e.g., YOADA)"
          className="w-full max-w-md p-2 text-black border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      
      {/* Affichage du nombre total de résultats */}
      <div className="mb-4 text-sm text-gray-600">
        {loading ? 
          <span>Searching pools...</span> : 
          <span>{totalResults} pool{totalResults !== 1 ? 's' : ''} found{searchTicker ? ` for "${searchTicker}"` : ''}</span>
        }
      </div>

      <PaginationControls />

      {poolsData.length === 0 && !loading ? (
        <div className="mt-4">No valid pool data available{searchTicker ? ` for "${searchTicker}"` : ''}.</div>
      ) : (
        <>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-grey-500/50 rounded-lg table-fixed">
              <colgroup>
                <col className={columnStyles.tickerColumn} />
                <col className={columnStyles.stakeColumn} />
                <col className={columnStyles.delegatorsColumn} />
                <col className={columnStyles.blocksColumn} />
                <col className={columnStyles.saturationColumn} />
              </colgroup>
              <thead>
                <tr>
                  <th className={`px-4 py-2 text-left ${columnStyles.tickerColumn}`}>Ticker & Name</th>
                  <th className={`px-4 py-2 text-left ${columnStyles.stakeColumn}`}>
                    Live Stake<br />
                    Active Stake
                  </th>
                  <th className={`px-4 py-2 cursor-pointer text-center ${columnStyles.delegatorsColumn}`}
                     onClick={() => handleSort('live_delegators')}>
                    Delegators {sortBy === 'live_delegators' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className={`px-4 py-2 cursor-pointer text-center ${columnStyles.blocksColumn}`}
                     onClick={() => handleSort('blocks_minted')}>
                    Blocks {sortBy === 'blocks_minted' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className={`px-4 py-2 cursor-pointer ${columnStyles.saturationColumn}`}
                     onClick={() => handleSort('live_saturation')}>
                    Saturation {sortBy === 'live_saturation' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderSkeletonRows() : poolsData.map((pool) => (
                  <tr key={pool.pool_id} className="border-t">
                    <td className={`px-4 py-2 ${columnStyles.tickerColumn}`}>
                      <Link to={`/pool/${pool.pool_id}`} className="text-sky-500 underline">
                        {pool.ticker || shortener(pool.pool_id)}
                      </Link>
                      <br />
                      <span className="text-sm truncate block">{pool.name || ''}</span>
                    </td>
                    <td className={`px-4 py-2 ${columnStyles.stakeColumn}`}>
                      {convertLovelaceToAda(pool.live_stake)} ₳<br />
                      {convertLovelaceToAda(pool.active_stake)} ₳
                    </td>
                    <td className={`px-4 py-2 text-center ${columnStyles.delegatorsColumn}`}>
                      {pool.live_delegators}
                    </td>
                    <td className={`px-4 py-2 text-center ${columnStyles.blocksColumn}`}>
                      {pool.blocks_minted}
                    </td>
                    <td className={`px-4 py-2 ${columnStyles.saturationColumn}`}>
                      <SaturationBar saturation={pool.live_saturation} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <PaginationControls />
            <p>100 pools / page</p>
          </div>
        </>
      )}
    </div>
  );
}

export default PoolsPage;