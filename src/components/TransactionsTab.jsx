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
    <div className="space-y-4 bg-transparent">
      {/* Header avec range et bouton de tri */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          Transactions ({startIndex + 1} to {endIndex} of {transactions.length})
        </h2>
        <button onClick={toggleSortOrder} className="btn btn-ghost flex items-center gap-1">
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

      {/* Table des transactions */}
      <div className="overflow-x-auto">
        <table className="table w-full bg-transparent text-base-content">
          <thead>
            <tr>
              <th className="bg-transparent">Date</th>
              <th className="bg-transparent">Hash</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((tx, index) => (
              <tr key={index} className="hover:bg-base-300">
                <td className="bg-transparent">{new Date(tx.timestamp * 1000).toLocaleString()}</td>
                <td className="bg-transparent flex items-center gap-2">
                  <Link className="link link-primary" to={`/tx/${tx.hash}`}>
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
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="btn btn-sm btn-ghost">
            <ChevronDoubleLeftIcon className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn btn-sm btn-ghost">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn btn-sm btn-ghost">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="btn btn-sm btn-ghost">
            <ChevronDoubleRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;