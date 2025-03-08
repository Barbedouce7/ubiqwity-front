import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../utils/apiConfig';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { shortener, convertLovelaceToAda } from '../utils/utils';

function ProposalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [proposalsData, setProposalsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [inputSearch, setInputSearch] = useState(searchParams.get('title') || '');
  const searchTimeout = useRef(null);

  const page = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sort') || 'deposit';
  const searchTitle = searchParams.get('title') || '';
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

  // Normalize Proposal data
  const normalizeProposalData = (rawData) => {
    if (!Array.isArray(rawData)) return [];
    return rawData.map(proposal => ({
      tx_hash: ensureString(proposal?.tx_hash, ''),
      cert_index: Number(proposal?.cert_index) || 0,
      governance_type: ensureString(proposal?.governance_type, 'Unknown'),
      title: ensureString(proposal?.metadata?.body?.title, 'Untitled'),
      deposit: Number(proposal?.deposit) || 0,
      enacted_epoch: ensureString(proposal?.enacted_epoch, 'N/A'),
      expired_epoch: ensureString(proposal?.expired_epoch, 'N/A'),
    }));
  };

  // Fetch Proposals data
  const fetchProposalsData = async (params) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.baseUrl}proposals`, {
        params: {
          sort: params.sortBy,
          order: params.sortOrder,
          page: params.page,
          limit: ITEMS_PER_PAGE,
          title: params.searchTitle || undefined,
        },
      });

      const { status, data: proposals, pagination } = response.data;
      if (status !== 'success' || !Array.isArray(proposals) || !pagination) {
        throw new Error(response.data?.message || 'Invalid API response');
      }

      setProposalsData(normalizeProposalData(proposals));
      setTotalPages(Number(pagination.pages) || 1);
      setTotalResults(Number(pagination.total) || 0);
    } catch (err) {
      setError(`Failed to load Proposals: ${err.message}`);
      setProposalsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposalsData({ sortBy, sortOrder, page, searchTitle });
  }, [sortBy, sortOrder, page, searchTitle]);

  const handleSort = (newSortBy) => {
    const newOrder = newSortBy === sortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    setSearchParams({ page: '1', sort: newSortBy, ...(searchTitle && { title: searchTitle }) });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({ page: String(newPage), sort: sortBy, ...(searchTitle && { title: searchTitle }) });
    }
  };

  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    setInputSearch(newValue);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchParams({ page: '1', sort: sortBy, ...(newValue && { title: newValue }) });
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
        <h1 className="text-2xl font-bold mb-4">Governance Proposals</h1>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 text-base-content">
      <h1 className="text-2xl font-bold mb-4">Governance Proposals</h1>
      <div className="mb-2">
        <input
          type="text"
          value={inputSearch}
          onChange={handleSearchChange}
          placeholder="Search by title"
          className="w-full sm:w-60 p-2 text-black border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div className="mb-4 text-sm text-gray-600">
        {loading ? 'Searching Proposals...' : `${totalResults} Proposal${totalResults !== 1 ? 's' : ''} found`}
      </div>
      <div className="overflow-x-auto mt-4">
        <div className="max-h-[70vh] overflow-y-auto border border-gray-300 rounded-lg">
          <table className="min-w-full border-collapse">
            <thead className="bg-base-100">
              <tr className="border-b border-gray-300">
                <th className="p-4 text-left sticky top-0 bg-base-100 z-10 border-r border-gray-300">
                  Title & Proposal ID
                </th>
                <th
                  className="p-4 text-center cursor-pointer sticky top-0 bg-base-100 z-10 border-r border-gray-300"
                  onClick={() => handleSort('deposit')}
                >
                  Deposit {sortBy === 'deposit' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="p-4 text-center cursor-pointer sticky top-0 bg-base-100 z-10 border-r border-gray-300"
                  onClick={() => handleSort('enacted_epoch')}
                >
                  Enacted Epoch {sortBy === 'enacted_epoch' && (sortOrder === 'desc' ? '↓' : '↑')}
                </th>
                <th className="p-4 text-center sticky top-0 bg-base-100 z-10">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                renderSkeletonRows()
              ) : proposalsData.length > 0 ? (
                proposalsData.map((proposal, index) => (
                  <tr
                    key={`proposal-${index}-${proposal.tx_hash}-${proposal.cert_index}`}
                    className="border-t border-gray-300"
                  >
                    <td className="p-4 border-r border-gray-300">
                      <Link
                        to={`/proposal/${proposal.tx_hash}/${proposal.cert_index}`}
                        className="text-primary underline"
                      >
                        <span className="truncate block">{proposal.title}</span>
                        ({shortener(proposal.tx_hash, 12)}/{proposal.cert_index})
                      </Link>
                    </td>
                    <td className="p-4 text-center border-r border-gray-300">
                      {convertLovelaceToAda(proposal.deposit)} ₳
                    </td>
                    <td className="p-4 text-center border-r border-gray-300">
                      {proposal.enacted_epoch}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2 py-1 rounded border border-gray-300 bg-blue-200 text-black">
                        {proposal.governance_type}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-300">
                  <td colSpan="4" className="p-4 text-center">
                    No Proposals found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {!loading && proposalsData.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={totalResults}
          />
          <p>{ITEMS_PER_PAGE} Proposals / page</p>
        </div>
      )}
    </div>
  );
}

export default ProposalsPage;