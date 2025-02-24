import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import logow from '/logo-white.svg';
import logob from '/logo-black.svg';
import { ServerIcon, HomeIcon, FingerPrintIcon } from '@heroicons/react/24/solid';

function Navbar({ handleSearch }) {
  const [searchInput, setSearchInput] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark') || 
    document.documentElement.classList.contains('vibrant')
  );
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark') || 
                    document.documentElement.classList.contains('vibrant'));
    };
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }

    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen, isMenuOpen]);

  const onSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const onSearchSubmit = (e) => {
    if (e) e.preventDefault();
    handleSearch(searchInput);
  };

  const toggleSearch = () => {
    if (isSearchOpen && searchInput.trim()) {
      // Si la recherche est ouverte et qu'il y a du texte, on lance la recherche
      onSearchSubmit();
    } else if (isSearchOpen && !searchInput.trim()) {
      // Si la recherche est ouverte mais vide, on ferme
      setIsSearchOpen(false);
      setSearchInput("");
    } else {
      // Si la recherche est fermée, on ouvre
      setIsSearchOpen(true);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="navbar bg-base-100 shadow-xl mx-auto max-w-lg h-[40px] text-base-content rounded-full mb-4">
      <div className="flex-1">
        <a href="/" className="text-xl ml-2 flex items-center">
          <img src={isDarkMode ? logow : logob} className="logo w-10 mr-4" alt="Ubiqwity logo" /> 
          Ubiqwity
        </a>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex items-center" ref={searchRef}>
          <div className={`
            transition-all duration-300 ease-in-out
            overflow-hidden
            ${isSearchOpen ? 'w-[200px] opacity-100' : 'w-0 opacity-0'}
          `}>
            <form onSubmit={onSearchSubmit} className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={onSearchChange}
                className="w-full input bg-base-100 border-2 shadow-xl input-bordered focus:inline-none rounded-md"
                placeholder="tx, address, ..."
              />
            </form>
          </div>
          
          <div className="flex">
            {isSearchOpen && (
              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchInput("");
                }} 
                className="btn btn-ghost btn-circle rounded hover:bg-gray-400/20"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-5 h-5"
                >
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <button 
              onClick={toggleSearch}
              className="btn btn-ghost btn-circle hover:bg-gray-400/20"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-5 h-5"
              >
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu déroulant */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={toggleMenu}
            className="btn btn-ghost btn-circle hover:bg-gray-400/20"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5"
            >
              <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Menu dropdown */}
<div className={`
            absolute right-0 mt-2 w-48 
            bg-base-100 rounded-lg shadow-lg 
            transition-all duration-200 ease-in-out
            ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
            z-50
          `}>
            <div className="p-2 space-y-1">
              <Link 
                to="/"
                className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-400/20 transition-colors duration-150"
                onClick={() => setIsMenuOpen(false)}
              >
                <HomeIcon className="w-5 h-5 mr-3" />
                Home
              </Link>
              <Link 
                to="/pools"
                className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-400/20 transition-colors duration-150"
                onClick={() => setIsMenuOpen(false)}
              >
                <ServerIcon className="w-5 h-5 mr-3"/>
                Pools
              </Link> 
              <Link 
                to="/about"
                className="flex items-center px-4 py-2 text-sm rounded-md hover:bg-gray-400/20 transition-colors duration-150"
                onClick={() => setIsMenuOpen(false)}
              >
                <FingerPrintIcon className="w-5 h-5 mr-3" />
                About
              </Link>
            </div>
          </div>





        </div>
      </div>
    </div>
  );
}

export default Navbar;