import React from "react";
import logo from '/logo-white.svg';


function Navbar() {
  return (
    <div className="navbar bg-slate-900 mx-auto max-w-lg max-h-20 text-slate-200 border-2 border-sky-900 rounded-full mb-4">
      <div className="flex-1">
        <a href="/" className="text-xl ml-2 flex">
          <img src={logo} className="logo w-12 mr-4" alt="Ubiqwity logo" /> Ubiqwity
        </a>
      </div>


      <div className="flex items-center gap-2">
        {/* Input de recherche */}
        <input
          type="text"
          className="grow input-bordered w-[140px] focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
          placeholder="tx, address, ..."
        />

        {/* Icône de recherche */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-8 w-8 opacity-70 mr-2 cursor-pointer"
        >
          <path
            fillRule="evenodd"
            d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>



    </div>
  );
}

export default Navbar;
