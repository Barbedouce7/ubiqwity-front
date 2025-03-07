import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
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
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
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
  const [inputTicker, setInputTicker] = useState(searchParams.get('ticker') || '');
  const searchTimeout = useRef(null);

  const page = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sort') || 'live_saturation';
  const searchTicker = searchParams.get('ticker') || '';
  const [sortOrder, setSortOrder] = useState('desc');

  const ITEMS_PER_PAGE = 100;

  const fetchPoolsData = async (params) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.baseUrl}pools`, {
        params: {
          sort: params.sortBy,
          order: params.sortOrder,
          page: params.page,
          limit: ITEMS_PER_PAGE,
          ticker: params.searchTicker || undefined,
        },
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

  useEffect(() => {
    fetchPoolsData({ sortBy, sortOrder, page, searchTicker });
  }, [page, sortBy, sortOrder, searchTicker]);

  const handleSort = (newSortBy) => {
    if (newSortBy === sortBy) {
      const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
      setSortOrder(newOrder);
      fetchPoolsData({ sortBy, sortOrder: newOrder, page, searchTicker });
    } else {
      setSearchParams({
        page: '1',
        sort: newSortBy,
        ...(searchTicker && { ticker: searchTicker }),
      });
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({
        page: newPage.toString(),
        sort: sortBy,
        ...(searchTicker && { ticker: searchTicker }),
      });
    }
  };

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setInputTicker(newValue);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchParams({
        page: '1',
        sort: sortBy,
        ...(newValue && { ticker: newValue }),
      });
    }, 500);
  };

  const renderSkeletonRows = () =>
    Array(10)
      .fill(0)
      .map((_, index) => (
        <tr key={`skeleton-${index}`} className="border-t border-gray-300 animate-pulse">
          <td className="px-4 py-2">
            <div className="h-5 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </td>
          <td className="px-4 py-2">
            <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </td>
          <td className="px-4 py-2">
            <div className="h-5 bg-gray-200 rounded w-12"></div>
          </td>
          <td className="px-4 py-2">
            <div className="h-5 bg-gray-200 rounded w-12"></div>
          </td>
          <td className="px-4 py-2">
            <div className="h-4 bg-gray-200 rounded-full w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-10 ml-auto"></div>
          </td>
        </tr>
      ));

  if (error) {
    return (
      <div className="container mx-auto p-4 text-base-content">
        <h1 className="text-2xl font-bold mb-4">Pools</h1>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const columnStyles = {
    tickerColumn: 'w-1/4 min-w-[200px]',
    stakeColumn: 'w-1/5 min-w-[160px]',
    delegatorsColumn: 'w-1/8 min-w-[100px]',
    blocksColumn: 'w-1/8 min-w-[100px]',
    saturationColumn: 'w-1/4 min-w-[160px]',
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
          className="w-full max-w-[240px] p-2 text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div className="mb-4 text-sm text-gray-600">
        {loading ? (
          <span>Searching pools...</span>
        ) : (
          <span>
            {totalResults} pool{totalResults !== 1 ? 's' : ''} found
            {searchTicker ? ` for "${searchTicker}"` : ''}
          </span>
        )}
      </div>
      {poolsData.length === 0 && !loading ? (
        <div className="mt-4">
          No valid pool data available{searchTicker ? ` for "${searchTicker}"` : ''}.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mt-4">
            <div className="max-h-[70vh] overflow-y-auto border border-gray-300 rounded-lg">
              <table className="min-w-full table-fixed border-collapse">
                <colgroup>
                  <col className={columnStyles.tickerColumn} />
                  <col className={columnStyles.stakeColumn} />
                  <col className={columnStyles.delegatorsColumn} />
                  <col className={columnStyles.blocksColumn} />
                  <col className={columnStyles.saturationColumn} />
                </colgroup>
                <thead className="bg-base-100">
                  <tr className="border-b border-gray-300">
                    <th
                      className={`px-4 py-2 text-left sticky top-0 bg-base-100 z-10 border-r border-gray-300 ${columnStyles.tickerColumn}`}
                    >
                      Ticker & Name
                    </th>
                    <th
                      className={`px-4 py-2 text-left sticky top-0 bg-base-100 z-10 border-r border-gray-300 ${columnStyles.stakeColumn}`}
                    >
                      Live Stake
                      <br />
                      Active Stake
                    </th>
                    <th
                      className={`px-4 py-2 cursor-pointer text-center sticky top-0 bg-base-100 z-10 border-r border-gray-300 ${columnStyles.delegatorsColumn}`}
                      onClick={() => handleSort('live_delegators')}
                    >
                      Delegators{' '}
                      {sortBy === 'live_delegators' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className={`px-4 py-2 cursor-pointer text-center sticky top-0 bg-base-100 z-10 border-r border-gray-300 ${columnStyles.blocksColumn}`}
                      onClick={() => handleSort('blocks_minted')}
                    >
                      Blocks {sortBy === 'blocks_minted' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className={`px-4 py-2 cursor-pointer sticky top-0 bg-base-100 z-10 ${columnStyles.saturationColumn}`}
                      onClick={() => handleSort('live_saturation')}
                    >
                      Saturation{' '}
                      {sortBy === 'live_saturation' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? renderSkeletonRows()
                    : poolsData.map((pool) => (
                        <tr key={pool.pool_id} className="border-t border-gray-300">
                          <td
                            className={`px-4 py-2 border-r border-gray-300 ${columnStyles.tickerColumn}`}
                          >
                            <Link
                              to={`/pool/${pool.pool_id}`}
                              className="text-sky-500 underline"
                            >
                              {pool.ticker || shortener(pool.pool_id)}
                            </Link>
                            <br />
                            <span className="text-sm truncate block">{pool.name || ''}</span>
                          </td>
                          <td
                            className={`px-4 py-2 border-r border-gray-300 ${columnStyles.stakeColumn}`}
                          >
                            {convertLovelaceToAda(pool.live_stake)} ₳
                            <br />
                            {convertLovelaceToAda(pool.active_stake)} ₳
                          </td>
                          <td
                            className={`px-4 py-2 text-center border-r border-gray-300 ${columnStyles.delegatorsColumn}`}
                          >
                            {pool.live_delegators}
                          </td>
                          <td
                            className={`px-4 py-2 text-center border-r border-gray-300 ${columnStyles.blocksColumn}`}
                          >
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
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={totalResults}
            />
            <p>{ITEMS_PER_PAGE} pools / page</p>
          </div>
        </>
      )}
    </div>
  );
}

export default PoolsPage;