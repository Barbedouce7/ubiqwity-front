import React, { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDark(!isDark);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button 
        onClick={toggleTheme}
        className="btn btn-circle btn-ghost"
        aria-label="Toggle theme"
      >
        {isDark ? 
          <SunIcon className="h-6 w-6 text-yellow-400" /> : 
          <MoonIcon className="h-6 w-6 text-gray-700" />
        }
      </button>
    </div>
  );
};

export default ThemeToggle;