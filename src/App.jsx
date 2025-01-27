import { useState, useEffect } from 'react';
import viteLogo from '/vite.svg';
import Navbar from "./Navbar"; 
import CurrencyListWithCharts from "./CurrencyListWithCharts";

import logo from '/logo-white.svg';   

function App() {
  const [apiData, setApiData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
    const response = await fetch("https://apiubi.hiddenlabs.cc/last24prices/");
    const data = await response.json();
    const reversedData = data.reverse();
    setApiData(reversedData);
    };

    fetchData();
  }, []);








  return (
    <div className="w-full max-w-lg mx-auto text-center p-2">

      <Navbar />

    <div style={{ padding: "16px" }}>
      {apiData.length > 0 ? (
        <CurrencyListWithCharts data={apiData} />
      ) : (
        <p>Chargement des données...</p>
      )}
    </div>



    </div>
  );
}

export default App;
