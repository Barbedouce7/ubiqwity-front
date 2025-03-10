import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { shortener, convertLovelaceToAda, addSpaces } from '../utils/utils';

function DrepsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drepsData, setDrepsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [inputHex, setInputHex] = useState(searchParams.get('givenName') || '');
  const searchTimeout = useRef(null);

  const page = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sort') || 'amount';
  const searchName = searchParams.get('hex') || '';
  const [sortOrder, setSortOrder] = useState('desc');

  const ITEMS_PER_PAGE = 100;

  // Ensure a value is a string, with fallback
  const ensureString = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(item => ensureString(item, '')).join(', ');
    if (typeof value === 'object' && '@value' in value) return ensureString(value['@value'], fallback);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Normalize DRep data, including givenName
  const normalizeDrepData = (rawData) => {
    if (!Array.isArray(rawData)) return [];
    return rawData.map(drep => ({
      drep_id: ensureString(drep?.drep_id, ''),
      hex: ensureString(drep?.hex, ''),
      givenName: ensureString(drep?.givenName, ''),
      amount: Number(drep?.amount) || 0,
      active_epoch: ensureString(drep?.active_epoch, 'N/A'),
      active: Boolean(drep?.active),
    }));
  };

  // Fetch DReps data
  const fetchDrepsData = async (params) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.baseUrl}dreps`, {
        params: {
          sort: params.sortBy,
          order: params.sortOrder,
          page: params.page,
          limit: ITEMS_PER_PAGE,
          givenName: params.searchName || undefined,
        },
      });

      const { status, data: dreps, pagination } = response.data;
      if (status !== 'success' || !Array.isArray(dreps) || !pagination) {
        throw new Error(response.data?.message || 'Invalid API response');
      }

      setDrepsData(normalizeDrepData(dreps));
      setTotalPages(Number(pagination.pages) || 1);
      setTotalResults(Number(pagination.total) || 0);
    } catch (err) {
      setError(`Failed to load DReps: ${err.message}`);
      setDrepsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrepsData({ sortBy, sortOrder, page, searchName });
  }, [sortBy, sortOrder, page, searchName]);

  const handleSort = (newSortBy) => {
    const newOrder = newSortBy === sortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    setSearchParams({ page: '1', sort: newSortBy, ...(searchName && { hex: searchName }) });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ page: String(newPage), sort: sortBy, ...(searchName && { hex: searchName }) });
    }
  };

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setInputHex(newValue);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchParams({ page: '1', sort: sortBy, ...(newValue && { hex: newValue }) });
    }, 500);
  };

  // Skeleton loading rows
  const renderSkeletonRows = () =>
    Array(5)
      .fill(0)
      .map((_, index) => (
        <tr key={`skeleton-${index}`} className="border-t border-gray-300 animate-pulse">
          <td className="p-4 border-r border-gray-300">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </td>
          <td className="p-4 border-r border-gray-300">
            <div className="h-5 bg-gray-200 rounded w-full"></div>
          </td>
          <td className="p-4 border-r border-gray-300">
            <div className="h-5 bg-gray-200 rounded w-full"></div>
          </td>
          <td className="p-4">
            <div className="h-5 bg-gray-200 rounded w-full"></div>
          </td>
        </tr>
      ));

  if (error) {
    return (
      <div className="container mx-auto p-4 text-base-content">
        <h1 className="text-2xl font-bold mb-4">DReps</h1>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">DReps</h1>
      <div className="mb-2">
        <input
          type="text"
          value={inputHex}
          onChange={handleSearchChange}
          placeholder="Search by name"
          className="w-full sm:w-60 p-2 text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div className="mb-4 text-sm text-gray-600">
        {loading ? 'Searching DReps...' : `${totalResults} DRep${totalResults !== 1 ? 's' : ''} found`}
      </div>
      <div className="overflow-x-auto mt-4">
        <div className="max-h-[70vh] overflow-y-auto border border-gray-300 rounded-lg">
          <table className="min-w-full border-collapse">
            <thead className="bg-base-100">
              <tr className="border-b border-gray-300">
                <th className="p-4 text-left sticky top-0 bg-base-100 z-10 border-r border-gray-300">
                  Name & DRep ID
                </th>
                <th
                  className="p-4 text-center cursor-pointer sticky top-0 bg-base-100 z-10 border-r border-gray-300"
                  onClick={() => handleSort('amount')}
                >
                  Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="p-4 text-center cursor-pointer sticky top-0 bg-base-100 z-10 border-r border-gray-300"
                  onClick={() => handleSort('active_epoch')}
                >
                  Active Epoch {sortBy === 'active_epoch' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="p-4 text-center sticky top-0 bg-base-100 z-10">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                renderSkeletonRows()
              ) : drepsData.length > 0 ? (
                drepsData.map((drep, index) => (
                  <tr key={`drep-${index}-${drep.drep_id}`} className="border-t border-gray-300">
                    <td className="p-4 border-r border-gray-300">
                      <Link to={`/drep/${drep.drep_id}`} className="text-primary underline">
                        <span className="truncate block">
                          {drep.givenName ? drep.givenName : shortener(drep.hex, 8)}
                        </span>
                        ({shortener(drep.drep_id, 12)})
                      </Link>
                    </td>
                    <td className="p-4 text-center border-r border-gray-300">
                      {addSpaces(convertLovelaceToAda(drep.amount))} ₳
                    </td>
                    <td className="p-4 text-center border-r border-gray-300">
                      {drep.active_epoch}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded border border-gray-300 ${
                          drep.active ? 'bg-green-400 text-black' : 'bg-red-400 text-black'
                        }`}
                      >
                        {drep.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-300">
                  <td colSpan="4" className="p-4 text-center">
                    No DReps found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && drepsData.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={totalResults}
          />
          <p>{ITEMS_PER_PAGE} DReps / page</p>
        </div>
      )}
    </div>
  );
}

export default DrepsPage;