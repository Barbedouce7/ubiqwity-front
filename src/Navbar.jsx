import React, { useState, useEffect } from 'react';
import logow from '/logo-white.svg';
import logob from '/logo-black.svg';

function Navbar({ handleSearch }) {
  const [searchInput, setSearchInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    // Fonction pour mettre à jour l'état lorsque la classe 'dark' change
    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    // Ajouter un écouteur pour les mutations de la classe 'dark' sur l'élément html
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Nettoyage de l'observer lors du démontage du composant
    return () => observer.disconnect();
  }, []);

  const onSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const onSearchSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    handleSearch(searchInput);
  };

  return (
    <div className="navbar bg-base-100 shadow-xl p-2 mx-auto max-w-lg h-[40px] text-base-content rounded-full mb-4">
      <div className="flex-1">
        <a href="/" className="text-xl ml-2 flex items-center">
          <img src={isDarkMode ? logow : logob} className="logo w-10 mr-4" alt="Ubiqwity logo" /> Ubiqwity
        </a>
      </div>

      <div className="flex items-center gap-2">
        {/* Formulaire de recherche */}
        <form onSubmit={onSearchSubmit} className="flex">
          <input
            type="text"
            value={searchInput}
            onChange={onSearchChange}
            className="grow input bg-base-100 border-2 shadow-xl input-bordered w-[100px] focus:outline-none focus:ring-2 focus:ring-sky-600 rounded-md "
            placeholder="tx, address, ..."
          />
          {/* Icône de recherche */}
          <button type="submit" className="btn btn-ghost btn-square ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-6 w-6 opacity-70"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default Navbar;