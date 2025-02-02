import React, { useState, useEffect } from 'react';
import logow from '/logo-white.svg';
import logob from '/logo-black.svg';

const Footer = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Fonction pour mettre à jour le thème
    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Initialiser l'état avec le thème actuel
    updateTheme(); 

    // Observer les changements de classe pour le mode sombre
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    // Nettoyage de l'observateur lors du démontage du composant
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer footer-center pt-10 text-base-content rounded">
      <div className="grid grid-flow-col gap-4">
        <img 
          src={isDarkMode ? logow : logob} 
          alt="Logo" 
          className="w-24 h-24"
        />
      </div>
    </footer>
  );
};

export default Footer;