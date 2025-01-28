import { useState, useEffect } from 'react';
import viteLogo from '/vite.svg';
import Navbar from "./Navbar"; 
import EpochChart from "./EpochChart";
import CurrencyListWithCharts from "./CurrencyListWithCharts";

import logo from '/logo-white.svg';   

function App() {
  const [apiData, setApiData] = useState([]);
  const [epochData, setEpochData] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
    const response = await fetch("https://apiubi.hiddenlabs.cc/last24prices/");
    const response2 = await fetch("https://apiubi.hiddenlabs.cc/epochdata/");
    const data = await response.json();
    const data2 = await response2.json();
    setEpochData(data2);
    const reversedData = data.reverse();
    setApiData(reversedData);
    };

    fetchData();
  }, []);








  return (
    <div className="w-full mx-auto text-center p-2">

      <Navbar />


      <div className="">
        {epochData ? (
          <EpochChart
            epochLabels={epochData.epochLabels}
            txCounts={epochData.txCounts}
            activeStakes={epochData.activeStakes}
          />
        ) : (
          <p className="text-white">Chargement des données...</p>
        )}
      </div>


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
