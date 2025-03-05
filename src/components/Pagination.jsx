// components/Pagination.jsx
import React from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronDoubleLeftIcon, 
  ChevronDoubleRightIcon 
} from '@heroicons/react/24/solid';

const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Calculer les numéros de page à afficher (5 pages max autour de la page courante)
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    return pages.slice(startPage - 1, endPage);
  };

  const visiblePages = getPageNumbers();

  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="flex items-center gap-2 text-sm opacity-70">
        <span>
          {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="btn btn-sm btn-ghost p-1"
          title="Première page"
        >
          <ChevronDoubleLeftIcon className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-sm btn-ghost p-1"
          title="Page précédente"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        <div className="flex gap-1">
          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-ghost'}`}
            >
              {page}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-sm btn-ghost p-1"
          title="Page suivante"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="btn btn-sm btn-ghost p-1"
          title="Dernière page"
        >
          <ChevronDoubleRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;