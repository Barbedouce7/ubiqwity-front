import React from "react";
import logo from '/logo-white.svg';


function Navbar() {
  return (
    <div className="navbar bg-slate-900 max-w-lg max-h-20 text-slate-200 border-2 border-sky-900 rounded-full mb-4">
      <div className="flex-1">
        <a href="/" className="text-xl ml-2 flex">
          <img src={logo} className="logo w-12 mr-4" alt="Ubiqwity logo" /> Ubiqwity
        </a>
      </div>

      <div className="flex-none">
        <div className="dropdown">
          <div tabIndex="0" role="button" className="btn btn-ghost btn-circle mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </div>
          <ul
            tabIndex="0"
            className="menu menu-sm dropdown-content bg-base-300 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            <li>
              <a href="/">Homepage</a>
            </li>
            <li>
              <a>About</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex-none">
        <button className="btn btn-ghost btn-circle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Navbar;
