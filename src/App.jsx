import { useState, useEffect } from 'react';
import viteLogo from '/vite.svg';
import Navbar from "./Navbar"; 

import logo from '/logo-white.svg';   

function App() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://apiubi.hiddenlabs.cc/home");
        if (!response.ok) throw new Error("Error with API");
        const result = await response.json();
        setData(result); // Stocke les données récupérées
      } catch (err) {
        setError(err.message); // Gère les erreurs
      } finally {
        setLoading(false); // Désactive le statut de chargement
      }
    };

    fetchData();
  }, []); // Vide, pour que l'appel API ne s'exécute qu'une fois





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







 {/* Affichage de l'état de chargement ou des données */}
        {loading ? (
          <p>Chargement des données...</p>
        ) : error ? (
          <p className="text-red-500">Erreur : {error}</p>
        ) : (
          <div className="bg-gray-100 p-4 rounded shadow">
            <h3 className="text-lg font-bold mb-2">Données récupérées :</h3>
            <p>
              {data.text}
            </p>
          </div>
        )}









    </div>
  );
}

export default App;
