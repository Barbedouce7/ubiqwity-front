import React, { useState, useEffect } from 'react';
import logow from '/logo-white.svg';
import logob from '/logo-black.svg';

const Footer = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    updateTheme(); 
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer footer-center pt-10 text-base-content rounded">
      <div className="grid grid-flow-row gap-0 mb-0">
        <img 
          src={isDarkMode ? logow : logob} 
          alt="Logo" 
          className="w-24 h-24"
        />      <p className="text-xl mt-0 mb-4">Ubiqwity</p>
        <p className="text-xs mb-20">Dates are UTC timezone.<br />Prices from Orcfax feed.</p>
      </div>

    </footer>
  );
};

export default Footer;