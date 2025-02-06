import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

const CurrencyListWithCharts = ({ data, circulatingSupply }) => {
  const prepareChartData = (prices, labels) => {
    return {
      labels: labels, // Plus ancien au plus récent
      datasets: [{
        data: prices, // Plus ancien au plus récent
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0
      }],
    };
  };

  const prepareInvertedChartData = (prices, dates) => {
    const invertedPrices = prices.map(price => 1 / price);
    
    return {
      labels: dates,
      datasets: [{
        data: invertedPrices,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0
      }]
    };
  };

  const getPriceChange = (latestPrice, initialPrice) => {
    const change = ((latestPrice - initialPrice) / initialPrice * 100).toFixed(2);
    const color = change >= 0 ? 'red' : 'green';
    return { change, color };
  };

  const getCurrencyPair = (currency, baseCurrency = 'ADA') => {
    const directPair = `${baseCurrency}-${currency}`;
    const inversePair = `${currency}-${baseCurrency}`;
    return data[0]?.price.find(item => Object.keys(item)[0] === directPair || Object.keys(item)[0] === inversePair);
  };

  const stablecoins = ["iUSD", "DJED", "USDM"];
  const allCurrencies = [...new Set(data[0]?.price.flatMap(item => {
    const [currency1, currency2] = Object.keys(item)[0].split('-');
    return [currency1, currency2];
  }))];

  // On enlève 'USD' et 'BTC' de la liste des devises à afficher
  const orderedCurrencies = allCurrencies.filter(currency => currency !== 'USD' && currency !== 'BTC').sort((a, b) => {
    if (a === "ADA") return -1;
    if (b === "ADA") return 1;
    if (stablecoins.includes(a) && !stablecoins.includes(b)) return -1;
    if (!stablecoins.includes(a) && stablecoins.includes(b)) return 1;
    return a.localeCompare(b);
  });

  const adaUsdPrice = data[0]?.price.find(item => Object.keys(item)[0] === "ADA-USD")?.["ADA-USD"] || 0;
  const dates = data.map(item => new Date(item.date).toLocaleTimeString());

  // Traitement spécial pour ADA en haut de la liste
  const adaPricePair = getCurrencyPair("ADA", "USD");
  const adaPrices = adaPricePair ? data.map(item => item.price.find(p => Object.keys(p)[0] === "ADA-USD")?.["ADA-USD"] || null).filter(price => price !== null) : [];
  const adaLatestPrice = adaPrices[adaPrices.length - 1] || 0;
  const adaInitialPrice = adaPrices[0] || 0;
  const { change: adaChange, color: adaColor } = getPriceChange(adaLatestPrice, adaInitialPrice);


  const marketCap = (circulatingSupply * adaLatestPrice / 1_000_000_000).toFixed(2);

  return (
    <div className="grid grid-cols-1 gap-2">
      <p>MarketCap : {marketCap} B $</p>
      {/* ADA en haut de la liste */}
      <div className="bg-base-100 shadow-md mt-2 p-2 flex items-center rounded-lg">
        <div className="w-1/4 text-base-content font-semibold">
          <img src="tokens/ada.png" alt="ADA" className="iconCurrency inline-block rounded-full w-8 h-8" />
          <p>ADA</p>
        </div>
        <div className="w-1/4 text-center font-semibold text-base-content">
          $ {adaLatestPrice.toFixed(4)}

          
        </div>
        <div className="w-1/4 text-center font-semibold text-base-content">
          <p className={`change24h text-sm price-change-${adaColor}-text`}>
            {adaChange >= 0 ? `+${adaChange}%` : `${adaChange}%`}
          </p>
        </div>
        <div className="w-1/3 h-[80px]">
          <Line
            data={prepareChartData(adaPrices, dates)}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { display: false },
                y: { display: false }
              },
              plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
              }
            }}
          />
        </div>
      </div>

      {/* Les autres devises */}
      {orderedCurrencies.map((currency, index) => {
        const pricePair = getCurrencyPair(currency);
        if (!pricePair) return null;

        const pairName = Object.keys(pricePair)[0];
        const isStablecoin = stablecoins.includes(currency);
        const isInverted = pairName.startsWith(currency);

        const prices = data.map(item => {
          const foundPair = item.price.find(p => Object.keys(p)[0] === pairName);
          return foundPair ? foundPair[pairName] : null;
        }).filter(price => price !== null);

        if (prices.length === 0) return null;

        const latestPrice = prices[prices.length - 1];
        const initialPrice = prices[0];
        const invertedLatestPrice = 1 / latestPrice;
        const invertedInitialPrice = 1 / initialPrice;

        const { change, color } = getPriceChange(invertedLatestPrice, invertedInitialPrice);


        let displayPrice = isInverted ? ( latestPrice).toFixed(4) : latestPrice.toFixed(4);
        let usdPrice = (latestPrice * adaUsdPrice).toFixed(4);

        if (isStablecoin && !isInverted) {
          displayPrice = (1 / latestPrice).toFixed(4);
          usdPrice = (1 / latestPrice * adaUsdPrice).toFixed(4);
        }

        return (
          <div key={currency} className="bg-base-100 shadow-md mt-2 p-2 flex items-center rounded-lg">
            <div className="w-1/4 text-base-content font-semibold">
              <img src={`tokens/${currency.toLowerCase()}.png`} alt={currency} className="iconCurrency inline-block rounded-full w-8 h-8" />
              <p>{currency}</p>
            </div>
            <div className="w-1/4 text-center font-semibold text-base-content">
              ₳ {displayPrice}
              {currency !== "ADA" && <p className="text-xs opacity-70">$ {usdPrice}</p>}
            </div>
            <div className="w-1/4 text-center font-semibold text-base-content">
              <p className={`price-change-${color}-text text-sm`}>
                {change >= 0 ? `+${change}%` : `${change}%`}
              </p>
            </div>
            <div className="w-1/3 h-[80px]">
              <Line
 data={isStablecoin ? prepareInvertedChartData(prices, dates) : prepareChartData(prices, dates)}

                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { display: false },
                    y: { display: false }
                  },
                  plugins: {
                    tooltip: { enabled: false },
                    legend: { display: false }
                  }
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CurrencyListWithCharts;