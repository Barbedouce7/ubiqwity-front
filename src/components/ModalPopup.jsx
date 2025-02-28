import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import CopyButton from '../components/CopyButton';

const MessageModal = ({ message, isOpen, onClose }) => {
  const handleModalClick = (e) => {
    e.stopPropagation(); // Prevent clicks inside modal from closing it
  };

  if (!isOpen) return null;

  const isError = message.includes('Error') || message.includes('not');
  
  return (
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
          <h3 className="text-lg font-semibold">
            {isError ? 'Error' : 'Success'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-base-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Contenu de la modal */}
        <div className="space-y-3">
          <div className={`p-3 rounded ${isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            <div className="font-medium">{isError ? '' : 'Success'}</div>
            {isError && (<p className="mt-1 break-words">{message}</p>)}<p className="mt-1 break-words">{message}</p>
          </div>
          
          {!isError && message.includes('stake') && (
            <div>
              <div className="text-sm opacity-70 mb-1">Stake Address</div>
              <div className="flex items-center gap-2 shadow p-2 rounded overflow-x-auto">
                <span className="font-mono text-sm break-all">
                  {message.match(/stake[a-zA-Z0-9]+/) || ''}
                </span>
                <CopyButton 
                  text={message.match(/stake[a-zA-Z0-9]+/)?.[0] || ''} 
                  className="flex-shrink-0" 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageModal;