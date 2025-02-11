import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import { SankeyController, Flow } from "chartjs-chart-sankey";
import { shortener } from "../utils/utils";

// Enregistrement du contrôleur Sankey
Chart.register(SankeyController, Flow);

function DiagramTab({ inputs, outputs }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Détecte le mode actuel (Light/Dark) en observant Tailwind
    const detectTheme = () => {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    };

    setTheme(detectTheme());

    const observer = new MutationObserver(() => {
      setTheme(detectTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!chartRef.current || !inputs || !outputs || inputs.length === 0 || outputs.length === 0) {
      return;
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
                links[key].units.push({ unit: outAmt.unit, quantity: flowQuantity });
              }

              remainingQuantity -= flowQuantity;
              allInputs[inputAddress][outAmt.unit] -= flowQuantity;
              if (remainingQuantity <= 0) break;
            }
          }
        }

        if (remainingQuantity > 0) {
          console.log(`Remaining quantity for ${outAmt.unit} at ${output.address}: ${remainingQuantity}`);
        }
      });
    });

    if (Object.keys(links).length === 0) {
      console.warn("Aucun transfert d'actifs détecté pour le Sankey Chart");
      return;
    }

    const linksArray = Object.values(links);

    // 🎨 Couleurs dynamiques selon le mode Light/Dark
    const colorText = theme === "dark" ? "#f8f9fa" : "#212529";
    const colorFrom = theme === "dark" ? "#38bdf8" : "#007BFF";
    const colorTo = theme === "dark" ? "#fbbf24" : "#FFA500";

    const data = {
      datasets: [
        {
          data: linksArray,
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

    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d");
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

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
                  const from = tooltipItem.raw.from;
                  const to = tooltipItem.raw.to;
                  const unitsData = tooltipItem.raw.units;
                  return unitsData.map((u) => `${u.quantity} ${u.unit}`);
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
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [inputs, outputs, theme]); // Mise à jour du graphique si le mode change

  return (
    <div>
      <canvas ref={chartRef}></canvas>
      <p className="mx-auto max-w-lg p-4 border-2 mt-6 rounded-full "><span className="text-blue-500">Blue are inputs</span>, <span className="text-orange-500">orange are outputs</span>.<br /> Addresses can be in input AND output.</p>
    </div>
  );
}

export default DiagramTab;
