import React, { useState, useEffect } from 'react';
import logow from '/logo-white.svg';
import logob from '/logo-black.svg';

const Footer = () => {
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
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