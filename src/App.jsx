import { useState } from 'react';
import viteLogo from '/vite.svg';
import Navbar from "./Navbar"; // Importation du composant Navbar

import logo from '/logo-white.svg';   

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="w-full max-w-lg mx-auto text-center p-2">

      <Navbar />



      <div className=" text-center p-12">
        <button
          className="btn bg-sky-700 w-40 mx-auto mb-6"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
        <p>
          
        </p>
        <button className="btn bg-sky-300 text-black">Test Button</button>

      </div>

    </div>
  );
}

export default App;
