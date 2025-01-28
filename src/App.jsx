import { useState, useEffect } from 'react';

import Navbar from "./Navbar"; 
import EpochContext from "./EpochContext";
import EpochChart from "./EpochChart";
import ChainUsage from "./ChainUsage";
import CurrencyListWithCharts from "./CurrencyListWithCharts";

import logo from '/logo-white.svg';   

function App() {
  const [apiData, setApiData] = useState([]);
  const [epochContext, setEpochContext] = useState([]);
  const [epochData, setEpochData] = useState([]);
  const [chainUsage, setChainUsage] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
    const responseChainUsage = await fetch("https://apiubi.hiddenlabs.cc/chainusage/");
    const dataChainUsageTableau = await responseChainUsage.json();
    const dataChainUsage = dataChainUsageTableau[0];
    setChainUsage(dataChainUsage);

    const responseEpochContext = await fetch("https://apiubi.hiddenlabs.cc/epochcontext/");
    const dataEpochContext = await responseEpochContext.json();
    //console.log(dataEpochContext);
    setEpochContext(dataEpochContext);

    const response = await fetch("https://apiubi.hiddenlabs.cc/last24prices/");
    const data = await response.json();
    const reversedData = data.reverse();
    setApiData(reversedData);


    const response2 = await fetch("https://apiubi.hiddenlabs.cc/epochdata/");
    const data2 = await response2.json();
    setEpochData(data2);

    };

    fetchData();
  }, []);








  return (
    <div className="w-full mx-auto text-center p-2">

      <Navbar />

    <div>
      {chainUsage && Object.keys(chainUsage).length > 0 ? (
         <ChainUsage data={chainUsage}/>
      ) : (
        <p>Loading...</p>
      )}
    </div>
    <EpochContext data={epochContext}/>

      <div className="">
        {epochData ? (
          <EpochChart
            epochLabels={epochData.epochLabels}
            txCounts={epochData.txCounts}
            activeStakes={epochData.activeStakes}
          />
        ) : (
          <p>Loading...</p>
        )}
      </div>


    <div>
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
