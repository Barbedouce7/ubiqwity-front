import React, { useEffect, useState } from 'react';
import { SunIcon, MoonIcon, SparklesIcon } from '@heroicons/react/24/outline';

const ThemeToggle = () => {
  // Theme peut être 'light', 'dark' ou 'vibrant'
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      applyTheme('dark');
    }
  }, []);

  const applyTheme = (newTheme) => {
    // Supprime toutes les classes de thème
    document.documentElement.classList.remove('dark', 'vibrant');
    
    // Applique la nouvelle classe si nécessaire
    if (newTheme !== 'light') {
      document.documentElement.classList.add(newTheme);
    }
    
    localStorage.setItem('theme', newTheme);
  };

  const cycleTheme = () => {
    const themeOrder = ['light', 'dark'];//, 'vibrant'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button 
        onClick={cycleTheme}
        className="p-2 rounded-full bg-base-300 opacity-80 hover:opacity-100 transition-opacity"
        aria-label="Toggle theme"
      >
        {theme === 'light' && (
          <SunIcon className="h-5 w-5 text-yellow-400" />
        )}
        {theme === 'dark' && (
          <MoonIcon className="h-5 w-5 text-blue-400" />
        )}
        {theme === 'vibrant' && (
          <SparklesIcon className="h-5 w-5 text-purple-400" />
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;