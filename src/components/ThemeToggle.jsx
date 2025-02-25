import React, { useEffect, useState, useRef } from 'react';
import { SunIcon, MoonIcon, SparklesIcon } from '@heroicons/react/24/outline';

const ThemeToggle = () => {
  // Theme peut être 'light', 'dark' ou 'vibrant'
  const [theme, setTheme] = useState('light');
  // État pour désactiver le bouton
  const [isDisabled, setIsDisabled] = useState(false);
  
  // Pour suivre les clics rapides
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  
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
    document.documentElement.classList.remove('dark', 'vibrant');
    if (newTheme !== 'light') {
      document.documentElement.classList.add(newTheme);
    }
    
    localStorage.setItem('theme', newTheme);
  };
  
  const toggleTheme = () => {
    // Basculer uniquement entre light et dark
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };
  
  const handleClick = () => {
    // Ne rien faire si le bouton est désactivé
    if (isDisabled) return;
    
    // Incrémenter le compteur de clics
    clickCountRef.current += 1;
    
    // Réinitialiser le timer précédent
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    
    // Si 4 clics rapides, activer le mode vibrant
    if (clickCountRef.current >= 4) {
      setTheme('vibrant');
      applyTheme('vibrant');
      clickCountRef.current = 0;
      
      // Désactiver le bouton pendant 1 seconde
      setIsDisabled(true);
      setTimeout(() => {
        setIsDisabled(false);
      }, 1000);
    } else {
      // Sinon, basculer entre light et dark
      toggleTheme();
      
      // Réinitialiser le compteur après 500ms (délai pour considérer les clics comme "rapides")
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 500);
    }
  };
  
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button 
        onClick={handleClick}
        className={`p-2 rounded-full bg-base-300 transition-all ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
        }`}
        aria-label="Toggle theme"
        disabled={isDisabled}
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