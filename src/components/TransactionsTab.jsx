import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CopyButton from './CopyButton';
import { shortener } from '../utils/utils';

const ITEMS_PER_PAGE = 10;
const MAX_VISIBLE_PAGES = 5;

const TransactionsTab = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('desc');

  const sortedTransactions = [...transactions].sort((a, b) => {
    const comparison = a.blockTime - b.blockTime;
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const totalPages = Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  // Function to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    if (totalPages <= MAX_VISIBLE_PAGES) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(currentPage + 1, totalPages - 1);
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = 4;
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Transactions ({transactions.length})</h2>
        <button
          onClick={toggleSortOrder}
          className="btn btn-ghost gap-2 normal-case"
        >
          {sortOrder === 'desc' ? (
            <>
              ^ Newest First 
            </>
          ) : (
            <>
              v Oldest First
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {currentTransactions.map((tx, index) => (
          <div key={index} className="card bg-base-100 shadow-lg rounded-lg overflow-hidden">
            <div className="card-body p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">
                  <strong>Date:</strong> {new Date(tx.blockTime * 1000).toLocaleString()}
                </span>
                <span className="text-sm font-semibold">
                  <strong>Block Height:</strong> {tx.blockHeight}
                </span>
              </div>
              <div className="text-left">
                <strong>Hash: </strong>
                <Link className="link link-primary" to={`/tx/${tx.txHash}`}>
                  {shortener(tx.txHash)}
                </Link>
                <CopyButton text={tx.txHash} className="ml-2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
          {/* First page button */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="btn btn-sm btn-ghost"
            aria-label="First page"
          >
            first
          </button>

          {/* Previous button */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn btn-sm btn-ghost"
          >
            Previous
          </button>
          
          {/* Page numbers */}
          <div className="flex gap-2">
            {getPageNumbers().map((number, index) => (
              number === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 py-1">...</span>
              ) : (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={`btn btn-sm ${
                    currentPage === number
                      ? 'btn-primary'
                      : 'btn-ghost'
                  }`}
                >
                  {number}
                </button>
              )
            ))}
          </div>
          
          {/* Next button */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn btn-sm btn-ghost"
          >
            Next
          </button>

          {/* Last page button */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="btn btn-sm btn-ghost"
            aria-label="Last page"
          >
            last
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionsTab;