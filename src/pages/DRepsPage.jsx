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

  // État local pour le champ de recherche
  const [inputHex, setInputHex] = useState(searchParams.get('hex') || '');
  // Délai de debounce pour la recherche
  const searchTimeout = useRef(null);

  const page = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sort') || 'amount';
  const searchHex = searchParams.get('hex') || '';
  const [sortOrder, setSortOrder] = useState('desc');

  const ITEMS_PER_PAGE = 100;

  // Fonction de fetch des données
  const fetchDrepsData = async (params) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.baseUrl}dreps`, {
        params: {
          sort: params.sortBy,
          order: params.sortOrder,
          page: params.page,
          limit: ITEMS_PER_PAGE,
          hex: params.searchHex || undefined
        }
      });

      if (!response.data || response.data.status !== 'success' || !response.data.pagination) {
        console.error('Invalid API structure:', response.data);
        throw new Error(response.data?.message || 'Invalid API response');
      }

      const { data, pagination } = response.data;
      setDrepsData(data || []);
      setTotalPages(pagination.pages || 1);
      setTotalResults(pagination.total || 0);
    } catch (err) {
      console.error('API Error:', err.response || err);
      setError(`Failed to load DReps: ${err.message}`);
      setDrepsData([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les données initiales et lors des changements de page/tri
  useEffect(() => {
    fetchDrepsData({
      sortBy,
      sortOrder,
      page,
      searchHex
    });
  }, [page, sortBy, sortOrder, searchHex]);

  const handleSort = (newSortBy) => {
    if (newSortBy === sortBy) {
      const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
      setSortOrder(newOrder);

      fetchDrepsData({
        sortBy,
        sortOrder: newOrder,
        page,
        searchHex
      });
    } else {
      setSearchParams({
        page: '1',
        sort: newSortBy,
        ...(searchHex && { hex: searchHex })
      });
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({
        page: newPage.toString(),
        sort: sortBy,
        ...(searchHex && { hex: searchHex })
      });
    }
  };

  // Gestion des changements dans le champ de recherche avec debounce
  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setInputHex(newValue);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setSearchParams({
        page: '1',
        sort: sortBy,
        ...(newValue && { hex: newValue })
      });
    }, 500);
  };

  // Fonction pour générer les lignes de tableau pour le chargement
  const renderSkeletonRows = () => {
    return Array(10).fill(0).map((_, index) => (
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
  };

  if (error) {
    return (
      <div className="container mx-auto p-4 text-base-content">
        <h1 className="text-2xl font-bold mb-4">DReps</h1>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Styles pour les en-têtes de colonnes
  const columnStyles = {
    idColumn: "w-2/5 min-w-[240px]",
    amountColumn: "w-1/5 min-w-[120px]",
    activeEpochColumn: "w-1/5 min-w-[120px]",
    statusColumn: "w-1/5 min-w-[120px]"
  };

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
        {loading ? (
          <span>Searching DReps...</span>
        ) : (
          <span>
            {totalResults} DRep{totalResults !== 1 ? 's' : ''} found{searchHex ? ` for "${searchHex}"` : ''}
          </span>
        )}
      </div>

      {drepsData.length === 0 && !loading ? (
        <div className="mt-4">No valid DRep data available{searchHex ? ` for "${searchHex}"` : ''}.</div>
      ) : (
        <>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-grey-500/50 rounded-lg table-fixed">
              <colgroup>
                <col className={columnStyles.idColumn} />
                <col className={columnStyles.amountColumn} />
                <col className={columnStyles.activeEpochColumn} />
                <col className={columnStyles.statusColumn} />
              </colgroup>
              <thead>
                <tr>
                  <th className={`px-4 py-2 text-left ${columnStyles.idColumn}`}>DRep ID & Hex</th>
                  <th
                    className={`px-4 py-2 cursor-pointer text-center ${columnStyles.amountColumn}`}
                    onClick={() => handleSort('amount')}
                  >
                    Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th
                    className={`px-4 py-2 cursor-pointer text-center ${columnStyles.activeEpochColumn}`}
                    onClick={() => handleSort('active_epoch')}
                  >
                    Active Epoch {sortBy === 'active_epoch' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className={`px-4 py-2 text-center ${columnStyles.statusColumn}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? renderSkeletonRows() : drepsData.map((drep) => (
                  <tr key={drep.drep_id} className="border-t">
                    <td className={`px-4 py-2 ${columnStyles.idColumn}`}>
                      <Link to={`/drep/${drep.drep_id}`} className="text-primary underline">
                        {shortener(drep.drep_id)}
                      </Link>
                      <br />
                      <span className="text-sm truncate block opacity-80">{drep.hex || ''}</span>
                    </td>
                    <td className={`px-4 py-2 text-center ${columnStyles.amountColumn}`}>
                      {convertLovelaceToAda(drep.amount)} ₳
                    </td>
                    <td className={`px-4 py-2 text-center ${columnStyles.activeEpochColumn}`}>
                      {drep.active_epoch}
                    </td>
                    <td className={`px-4 py-2 text-center ${columnStyles.statusColumn}`}>
                      <span
                        className={`inline-block px-2 py-1 rounded ${
                          drep.active ? 'bg-green-400 text-black' : 'bg-red-400 text-black'
                        }`}
                      >
                        {drep.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        </>
      )}
    </div>
  );
}

export default DrepsPage;