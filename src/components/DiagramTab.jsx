import React, { useEffect, useRef, useState, useContext, useMemo, useCallback } from "react";
import { Chart } from "chart.js/auto";
import { SankeyController, Flow } from "chartjs-chart-sankey";
import { shortener } from "../utils/utils";
import { TokenContext } from '../utils/TokenContext';

Chart.register(SankeyController, Flow);

function DiagramTab({ inputs, outputs }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [theme, setTheme] = useState(
    document.documentElement.classList.contains('dark') || 
    document.documentElement.classList.contains('vibrant')
  );
  const { tokenMetadata, fetchTokenData } = useContext(TokenContext);
  const [processedTokens, setProcessedTokens] = useState({});
  const [hasTransfers, setHasTransfers] = useState(true);

  const detectTheme = useCallback(() => {
    if (document.documentElement.classList.contains("dark")) {
      return "dark";
    } else if (document.documentElement.classList.contains("vibrant")) {
      return "dark";
    } else {
      return "light";
    }
  }, []);

  useEffect(() => {
    setTheme(detectTheme());

    const observer = new MutationObserver(() => {
      setTheme(detectTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [detectTheme]);

  // Mémoriser les fonctions utilitaires
  const formatQuantity = useCallback((quantity, unit) => {
    if (unit === 'lovelace') {
      return (quantity / 1000000).toFixed(6);
    }
    const metadata = processedTokens[unit];
    if (metadata?.decimals) {
      return (quantity / Math.pow(10, metadata.decimals)).toFixed(metadata.decimals);
    }
    return quantity.toString();
  }, [processedTokens]);

  const getDisplayUnit = useCallback((unit) => {
    if (unit === 'lovelace') return 'ADA';
    const metadata = processedTokens[unit];
    return metadata?.ticker || metadata?.name || shortener(unit);
  }, [processedTokens]);

  // Mémoriser le traitement des tokens
  const uniqueTokens = useMemo(() => {
    if (!inputs?.length || !outputs?.length) return new Set();
    
    const tokens = new Set();
    [...inputs, ...outputs].forEach(io => {
      io.amount.forEach(amt => tokens.add(amt.unit));
    });
    return tokens;
  }, [inputs, outputs]);

  useEffect(() => {
    const processTokens = async () => {
      const processedMetadata = {};
      for (const unit of uniqueTokens) {
        try {
          if (unit === 'lovelace') {
            processedMetadata[unit] = { ticker: 'ADA', decimals: 6 };
          } else if (!processedTokens[unit]) { // Vérifier si on n'a pas déjà les métadonnées
            const metadata = tokenMetadata[unit] || await fetchTokenData(unit);
            processedMetadata[unit] = metadata;
          }
        } catch (error) {
          console.error(`Error processing token ${unit}:`, error);
        }
      }
      setProcessedTokens(prev => ({...prev, ...processedMetadata}));
    };

    if (uniqueTokens.size > 0) {
      processTokens();
    }
  }, [uniqueTokens, tokenMetadata, fetchTokenData]);

  // Mémoriser la préparation des données pour le graphique
  const chartData = useMemo(() => {
    if (!inputs?.length || !outputs?.length || Object.keys(processedTokens).length === 0) {
      return null;
    }

    const convertToFlow = (quantity) => quantity;
    const links = {};
    const allInputs = inputs.reduce((acc, input) => {
      if (input.address && Array.isArray(input.amount)) {
        acc[input.address] = acc[input.address] || {};
        input.amount.forEach((amt) => {
          if (amt.unit && !isNaN(parseInt(amt.quantity, 10))) {
            acc[input.address][amt.unit] = (acc[input.address][amt.unit] || 0) + parseInt(amt.quantity, 10);
          }
        });
      }
      return acc;
    }, {});

    outputs.forEach((output) => {
      if (!output.address || !Array.isArray(output.amount)) return;

      output.amount.forEach((outAmt) => {
        if (!outAmt.unit || isNaN(parseInt(outAmt.quantity, 10))) return;
        let remainingQuantity = parseInt(outAmt.quantity, 10);

        for (const [inputAddress, inputAmts] of Object.entries(allInputs)) {
          if (inputAddress !== output.address && inputAmts[outAmt.unit]) {
            const inputQuantity = inputAmts[outAmt.unit];

            if (inputQuantity > 0) {
              const flowQuantity = Math.min(remainingQuantity, inputQuantity);
              const flow = convertToFlow(flowQuantity);

              const key = `${inputAddress}-${output.address}`;
              if (!links[key]) {
                links[key] = {
                  from: shortener(inputAddress),
                  to: shortener(output.address),
                  flow: 0,
                  units: [],
                };
              }

              links[key].flow += flow;
              const existingUnit = links[key].units.find((u) => u.unit === outAmt.unit);
              if (existingUnit) {
                existingUnit.quantity += flowQuantity;
              } else {
                links[key].units.push({
                  unit: outAmt.unit,
                  quantity: flowQuantity,
                  displayUnit: getDisplayUnit(outAmt.unit)
                });
              }

              remainingQuantity -= flowQuantity;
              allInputs[inputAddress][outAmt.unit] -= flowQuantity;
              if (remainingQuantity <= 0) break;
            }
          }
        }
      });
    });

    setHasTransfers(Object.keys(links).length > 0);
    return Object.values(links);
  }, [inputs, outputs, processedTokens, getDisplayUnit]);

  // Effet pour le rendu du graphique
  useEffect(() => {
    if (!chartRef.current || !chartData || chartData.length === 0) {
      return;
    }

    const colorText = theme === "dark" ? "#f8f9fa" : "#212529";
    const colorFrom = theme === "dark" ? "#38bdf8" : "#007BFF";
    const colorTo = theme === "dark" ? "#fbbf24" : "#FFA500";

    const data = {
      datasets: [
        {
          data: chartData,
          colorFrom: colorFrom,
          colorTo: colorTo,
          color: colorText,
          borderWidth: 0,
          hoverBorderWidth: 3,
          hoverBorderColor: "#ff0000",
          nodeWidth: 20,
        },
      ],
    };

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "sankey",
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                const unitsData = tooltipItem.raw.units;
                return unitsData.map((u) => 
                  `${formatQuantity(u.quantity, u.unit)} ${u.displayUnit}`
                );
              },
            },
          },
        },
        title: {
          display: true,
          text: "Transaction UTXOs",
          font: { size: 20 },
        },
        interaction: {
          mode: "nearest",
          intersect: false,
        },
        onHover: (event, elements) => {
          event.native.target.style.cursor = elements.length ? "pointer" : "default";
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData, theme, formatQuantity]);

  return (
    <div>
      {hasTransfers ? (
        <>
          <canvas ref={chartRef}></canvas>
          <p className="mx-auto max-w-lg p-4 border-2 mt-6 rounded-full">
            <span className="text-blue-500">Blue are inputs</span>, 
            <span className="text-orange-500">orange are outputs</span>.
            <br /> Addresses can be in input AND output.
          </p>
        </>
      ) : (
        <p className="mx-auto max-w-lg mt-6">
          This transaction represents UTXO management only - no assets have changed ownership between different addresses.
        </p>
      )}
    </div>
  );
}

export default DiagramTab;