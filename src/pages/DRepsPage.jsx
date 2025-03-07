import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { shortener, convertLovelaceToAda } from '../utils/utils';

function DrepsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drepsData, setDrepsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [inputHex, setInputHex] = useState(searchParams.get('hex') || '');
  const searchTimeout = useRef(null);

  const page = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sort') || 'amount';
  const searchHex = searchParams.get('hex') || '';
  const [sortOrder, setSortOrder] = useState('desc');

  const ITEMS_PER_PAGE = 100;

  // Fonction pour transformer en chaîne avec logs
  const ensureString = (value, fallback = 'N/A') => {
    console.log('ensureString called with:', value);
    try {
      if (value === null || value === undefined) return fallback;
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      if (typeof value === 'boolean') return String(value);
      if (Array.isArray(value)) return value.map(item => ensureString(item, '')).join(', ');
      if (typeof value === 'object' && '@value' in value) {
        console.log('Found @value object:', value);
        return ensureString(value['@value'], fallback);
      }
      if (typeof value === 'object') {
        console.log('Converting object to string:', value);
        return JSON.stringify(value);
      }
      return String(value);
    } catch (err) {
      console.error('ensureString error:', err, 'Value:', value);
      return fallback;
    }
  };

  // Normalisation avec logs détaillés
  const normalizeDrepData = (rawData) => {
    console.log('normalizeDrepData started with rawData:', rawData);
    if (!Array.isArray(rawData)) {
      console.error('normalizeDrepData: Expected array, got:', typeof rawData, rawData);
      return [];
    }

    return rawData.map((drep, index) => {
      console.log(`Normalizing Drep ${index}:`, drep);
      try {
        const normalized = {
          drep_id: ensureString(drep?.drep_id, 'Unknown ID'),
          hex: ensureString(drep?.hex, 'Unknown Hex'),
          amount: Number(drep?.amount) || 0,
          active_epoch: ensureString(drep?.active_epoch, 'N/A'),
          active: Boolean(drep?.active),
        };
        console.log(`Normalized Drep ${index}:`, normalized);
        return normalized;
      } catch (error) {
        console.error(`Error normalizing Drep ${index}:`, error, drep);
        return {
          drep_id: 'Error',
          hex: 'Error processing data',
          amount: 0,
          active_epoch: 'N/A',
          active: false,
        };
      }
    });
  };

  // Récupération des données avec logs
  const fetchDrepsData = async (params) => {
    console.log('fetchDrepsData started with params:', params);
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.baseUrl}dreps`, {
        params: {
          sort: params.sortBy,
          order: params.sortOrder,
          page: params.page,
          limit: ITEMS_PER_PAGE,
          hex: params.searchHex || undefined,
        },
      });
      console.log('Raw API response:', response.data);

      const data = response?.data;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response');
      }

      const { status, data: dreps, pagination } = data;
      console.log('API status:', status, 'dreps:', dreps, 'pagination:', pagination);
      if (status !== 'success' || !Array.isArray(dreps) || !pagination) {
        throw new Error(data?.message || 'Invalid API response structure');
      }

      const normalizedData = normalizeDrepData(dreps);
      console.log('Normalized data:', normalizedData);
      setDrepsData(normalizedData);
      setTotalPages(Number(pagination.pages) || 1);
      setTotalResults(Number(pagination.total) || 0);
    } catch (err) {
      console.error('fetchDrepsData Error:', err);
      setError(`Failed to load DReps: ${err.message}`);
      setDrepsData([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
      console.log('fetchDrepsData completed');
    }
  };

  // Effet avec log
  useEffect(() => {
    console.log('useEffect triggered with:', { sortBy, sortOrder, page, searchHex });
    fetchDrepsData({ sortBy, sortOrder, page, searchHex });
  }, [sortBy, sortOrder, page, searchHex]);

  const handleSort = (newSortBy) => {
    const newOrder = newSortBy === sortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    setSearchParams({ page: '1', sort: newSortBy, ...(searchHex && { hex: searchHex }) });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ page: String(newPage), sort: sortBy, ...(searchHex && { hex: searchHex }) });
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

  const renderSkeletonRows = () =>
    Array(5)
      .fill(0)
      .map((_, index) => (
        <tr key={`skeleton-${index}`} className="border-t animate-pulse">
          <td className="px-4 py-2 w-2/5">
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </td>
          <td className="px-4 py-2 w-1/5">
            <div className="h-5 bg-gray-200 rounded w-20"></div>
          </td>
          <td className="px-4 py-2 w-1/5">
            <div className="h-5 bg-gray-200 rounded w-12"></div>
          </td>
          <td className="px-4 py-2 w-1/5">
            <div className="h-5 bg-gray-200 rounded w-12"></div>
          </td>
        </tr>
      ));

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="container mx-auto p-4 text-base-content">
        <h1 className="text-2xl font-bold mb-4">DReps</h1>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  console.log('Rendering main component, drepsData:', drepsData);

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">DReps</h1>
      <div className="mb-2">
        <input
          type="text"
          value={inputHex}
          onChange={handleSearchChange}
          placeholder="Search by hex (e.g., db1bc)"
          className="w-full max-w-[240px] p-2 text-black border rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div className="mb-4 text-sm text-gray-600">
        {loading ? 'Searching DReps...' : `${totalResults} DRep${totalResults !== 1 ? 's' : ''} found`}
      </div>
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border border-grey-500/50 rounded-lg table-fixed">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left w-2/5">DRep ID & Hex</th>
              <th
                className="px-4 py-2 cursor-pointer text-center w-1/5"
                onClick={() => handleSort('amount')}
              >
                Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th
                className="px-4 py-2 cursor-pointer text-center w-1/5"
                onClick={() => handleSort('active_epoch')}
              >
                Active Epoch {sortBy === 'active_epoch' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-4 py-2 text-center w-1/5">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              renderSkeletonRows()
            ) : drepsData.length > 0 ? (
              drepsData.map((drep, index) => {
                console.log(`Rendering Drep ${index}:`, drep);
                return (
                  <tr key={`drep-${index}-${drep.drep_id}`} className="border-t">
                    <td className="px-4 py-2 w-2/5">
                      <Link to={`/drep/${drep.drep_id}`} className="text-primary underline">
                        {drep.drep_id}
                      </Link>
                      <br />
                      <span className="text-sm truncate block opacity-80">{drep.hex}</span>
                    </td>
                    <td className="px-4 py-2 text-center w-1/5">{drep.amount} ₳</td>
                    <td className="px-4 py-2 text-center w-1/5">{drep.active_epoch}</td>
                    <td className="px-4 py-2 text-center w-1/5">
                      <span
                        className={`inline-block px-2 py-1 rounded ${
                          drep.active ? 'bg-green-400 text-black' : 'bg-red-400 text-black'
                        }`}
                      >
                        {drep.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-2 text-center">
                  No DReps found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!loading && drepsData.length > 0 && (
        <div className="mt-4">
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