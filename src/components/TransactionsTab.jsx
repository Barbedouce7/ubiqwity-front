import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { shortener } from '../utils/utils';
import CopyButton from '../components/CopyButton';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronDoubleLeftIcon, 
  ChevronDoubleRightIcon, 
  ArrowDownIcon, 
  ArrowUpIcon 
} from '@heroicons/react/24/solid';

const ITEMS_PER_PAGE = 10;

const TransactionsTab = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc');
  
  const sortedTransactions = [...transactions].sort((a, b) => {
    const comparison = a.timestamp - b.timestamp;
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const totalPages = Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, transactions.length);
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 rounded-box">
      {/* Header with range and sort button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h3 className="text-lg font-bold mb-2 md:mb-0">
          Transactions ({startIndex + 1}..{endIndex} / {transactions.length})
        </h3>
        <button onClick={toggleSortOrder} className="flex text-xs border p-2 text-base-content rounded">
          {sortOrder === 'desc' ? (
            <>
              <ArrowDownIcon className="w-5 h-5" /> Newest First
            </>
          ) : (
            <>
              <ArrowUpIcon className="w-5 h-5" /> Oldest First
            </>
          )}
        </button>
      </div>

      {/* Transactions table */}
      <div className="overflow-x-auto">
        <table className="table-compact w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((tx, index) => (
              <tr key={index} className="hover:bg-base-300/50">
                <td className="text-sm">{new Date(tx.timestamp * 1000).toLocaleString()}</td>
                <td className="flex items-center gap-2">
                  <Link className="link link-hover" to={`/tx/${tx.hash}`}>
                    {shortener(tx.hash)}
                  </Link>
                  <CopyButton text={tx.hash} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="btn btn-sm btn-outline">
            <ChevronDoubleLeftIcon className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn btn-sm btn-outline">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn btn-sm btn-outline">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="btn btn-sm btn-outline">
            <ChevronDoubleRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;