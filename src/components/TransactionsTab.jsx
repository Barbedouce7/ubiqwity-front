import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shortener } from '../utils/utils';
import CopyButton from '../components/CopyButton';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronDoubleLeftIcon, 
  ChevronDoubleRightIcon, 
  ArrowDownIcon, 
  ArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { getScriptName } from '../utils/scriptMapping';
import ScriptBadge from '../components/ScriptBadge';


const scriptName = getScriptName(script);

const ITEMS_PER_PAGE = 10;

const TransactionsTab = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc');
  const [showUTC, setShowUTC] = useState(false);
  
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    if (showUTC) {
      return date.toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
    } else {
      return date.toLocaleString();
    }
  };

  const toggleTimeZone = () => {
    setShowUTC(prev => !prev);
  };
  
  return (
    <div className="space-y-4 rounded-box">
      {/* Header with range, sort button, and timezone switch */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h3 className="text-lg font-bold mb-2 md:mb-0">
          Transactions ({startIndex + 1}..{endIndex} / {transactions.length})
        </h3>
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs">
              {showUTC ? 'UTC' : 'Local timezone'}
            </span>
            <input 
              type="checkbox" 
              className="toggle toggle-sm" 
              checked={showUTC}
              onChange={toggleTimeZone}
            />
          </label>
          <button onClick={toggleSortOrder} className="flex text-xs border p-2 text-base-content rounded">
            {sortOrder === 'desc' ? (
              <>
                <ArrowDownIcon className="w-5 h-5 text-base-content" /> Newest First
              </>
            ) : (
              <>
                <ArrowUpIcon className="w-5 h-5 text-base-content" /> Oldest First
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Transactions table */}
      <div className="overflow-x-auto">
        <table className="table-compact w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Hash</th>
              <th>Scripts</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.map((tx, index) => (
              <tr key={index} className="hover:bg-base-300/50">
                <td className="text-sm">{formatDate(tx.timestamp)}</td>
                <td className="flex items-center gap-2">
                  <Link className="link link-hover" to={`/tx/${tx.hash}`}>
                    {shortener(tx.hash)}
                  </Link>
                  <CopyButton text={tx.hash} />
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {tx.scripts && tx.scripts.length > 0 ? (
                      tx.scripts.map((script, scriptIndex) => (
                        <ScriptBadge key={scriptIndex} script={script} />
                      ))
                    ) : (
                      <span className="text-xs opacity-60">No scripts</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4 text-base-content">
          <button 
            onClick={() => setCurrentPage(1)} 
            disabled={currentPage === 1} 
            className="btn-outline"
          >
            <ChevronDoubleLeftIcon className="w-5 h-5 text-base-content" />
          </button>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            disabled={currentPage === 1} 
            className="btn-outline"
          >
            <ChevronLeftIcon className="w-5 h-5 text-base-content" />
          </button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
            disabled={currentPage === totalPages} 
            className="btn-outline"
          >
            <ChevronRightIcon className="w-5 h-5 text-base-content" />
          </button>
          <button 
            onClick={() => setCurrentPage(totalPages)} 
            disabled={currentPage === totalPages} 
            className="btn-outline"
          >
            <ChevronDoubleRightIcon className="w-5 h-5 text-base-content" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;