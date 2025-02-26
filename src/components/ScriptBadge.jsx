import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import CopyButton from './CopyButton';
import scriptMappings from '../utils/scriptMapping';

// Fonction pour obtenir le nom du script
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

export default ScriptBadge;