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
import scriptMappings from '../utils/scriptMapping';

const getScriptName = (scriptHash) => {
  return scriptMappings[scriptHash] || "Unknown script";
};

// Composant modal qui sera affiché au centre de l'écran
const ScriptModal = ({ isOpen, onClose, script }) => {
  // Si la modal n'est pas ouverte, ne pas la rendre
  if (!isOpen) return null;
  
  // Empêcher la propagation du clic à l'intérieur de la modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  const scriptName = getScriptName(script);
  
  return (
    // Overlay qui couvre tout l'écran
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Modal centrée */}
      <div 
        className="bg-base-100 rounded-lg shadow-xl p-4 max-w-md w-11/12 flex flex-col"
        onClick={handleModalClick}
      >
        {/* Header avec bouton fermer */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Script Details</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-base-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Contenu de la modal */}
        <div className="space-y-3">
          <div>
            <div className="text-sm opacity-70 mb-1">Name</div>
            <div className="font-semibold">{scriptName}</div>
          </div>
          
          <div>
            <div className="text-sm opacity-70 mb-1">Hash</div>
            <div className="flex items-center gap-2 shadow p-2 rounded overflow-x-auto">
              <span className="font-mono text-sm break-all">{script}</span>
              <CopyButton text={script} className="flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Badge avec ouverture de modal au clic
const ScriptBadge = ({ script }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const openModal = () => {
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <span 
        className="badge badge-sm cursor-pointer hover:bg-primary p-2"
        onClick={openModal}
      >
        {getScriptName(script)}
      </span>
      
      <ScriptModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        script={script} 
      />
    </>
  );
};

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