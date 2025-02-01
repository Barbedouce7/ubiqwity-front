import React, { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false); // Initialisation à false par défaut

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
    const newIsDark = !isDark;
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    setIsDark(newIsDark);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <label className="swap swap-rotate bg-base-300 rounded-full p-1 opacity-80">
        <input type="checkbox" checked={isDark} onChange={toggleTheme} />

        {/* sun icon */}
        <SunIcon className={`swap-on h-5 w-5 text-yellow-400`} />
        
        {/* moon icon */}
        <MoonIcon className={`swap-off h-5 w-5 text-blue-400`} />
      </label>
    </div>
  );
};

export default ThemeToggle;