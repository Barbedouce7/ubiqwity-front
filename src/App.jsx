import { useState } from 'react';
import viteLogo from '/vite.svg';
import logo from '/logo-white.svg';   

function App() {
  const [count, setCount] = useState(0);

  return (
<div className="w-full max-w-lg mx-auto text-center p-2">




<div class="navbar bg-base-300 rounded-full mb-4">
    <div class="flex-1">
    <a class=" text-xl ml-2 flex"><img src={logo} className="logo w-12 mr-4" alt="Ubiqwity logo" /> Ubiqwity</a>
  </div>

  <div class="flex-none">
    <div class="dropdown">
      <div tabindex="0" role="button" class="btn btn-ghost btn-circle mr-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </div>
      <ul
        tabindex="0"
        class="menu menu-sm dropdown-content bg-base-300 rounded-box z-[1] mt-3 w-52 p-2 shadow">
        <li><a>Homepage</a></li>
        <li><a>About</a></li>
      </ul>  
     </div>
  </div>
  <div class="flex-none">
     <button class="btn btn-ghost btn-circle">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  </div>
</div>


      <div className=" text-center bg-base-300 p-12">
        <button
          className="btn btn-primary w-40 mx-auto mb-6"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        <p>
          W.I.P
        </p>
      </div>
    </div>
  );
}

export default App;
