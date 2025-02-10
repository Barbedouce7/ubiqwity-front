import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import { SankeyController, Flow } from "chartjs-chart-sankey";
import { shortener } from '../utils/utils';

// Register the Sankey plugin
Chart.register(SankeyController, Flow);

function DiagramTab({ inputs, outputs }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !inputs || !outputs || inputs.length === 0 || outputs.length === 0) {
      return;
    }

    const convertToFlow = (quantity) => {
      return quantity; // If you need a different conversion, adjust here
    };

    const links = {};

    // Aggregate inputs
    const allInputs = inputs.reduce((acc, input) => {
      if (input.address && Array.isArray(input.amount)) {
        acc[input.address] = acc[input.address] || {};
        input.amount.forEach(amt => {
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

              // Create or update link
              const key = `${inputAddress}-${output.address}`;
              if (!links[key]) {
                links[key] = {
                  from: shortener(inputAddress),
                  to: shortener(output.address),
                  flow: 0,
                  units: []
                };
              }

              // Update link with the new flow and unit
              links[key].flow += flow;
              const existingUnit = links[key].units.find(u => u.unit === outAmt.unit);
              if (existingUnit) {
                existingUnit.quantity += flowQuantity;
              } else {
                links[key].units.push({ unit: outAmt.unit, quantity: flowQuantity });
              }

              remainingQuantity -= flowQuantity;
              allInputs[inputAddress][outAmt.unit] -= flowQuantity;
              if (remainingQuantity <= 0) break; // Stop if output quantity is fully matched
            }
          }
        }
        
        if (remainingQuantity > 0) {
          console.log(`Remaining quantity for ${outAmt.unit} at ${output.address}: ${remainingQuantity}`);
        }
      });
    });

    if (Object.keys(links).length === 0) {
      console.warn("No asset transfers detected for the Sankey Chart");
      return;
    }

    // Convert links object to array for chart.js
    const linksArray = Object.values(links);

    // Setup chart data with new options
    const data = {
      datasets: [{
        data: linksArray,
        colorFrom: "#007BFF", // Bright blue for better visibility
        colorTo: "#FFA500",   // Orange for better visibility
        color: '#666666',
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#ff0000',
        nodeWidth: 20
      }],
    };

    // Create or update the chart
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
                label: function(tooltipItem) {
                  const from = tooltipItem.raw.from;
                  const to = tooltipItem.raw.to;
                  const unitsData = tooltipItem.raw.units;
                  const unitsTextArray = unitsData.map(function(u) {
                    return `${u.quantity} ${u.unit}`;
                  });
                  return [
                    `${from} → ${to}`,
                    ...unitsTextArray
                  ];
                }
              }
            }
          },
          onClick: function(evt, elements) {
            if (elements.length > 0) {
              const datasetIndex = elements[0].datasetIndex;
              const index = elements[0].index;
              const data = chartInstance.current.data.datasets[datasetIndex].data[index];
              const address = data.to || data.from;  // Check if the address exists
              if (address) {
                let url = '/?wallet=';
                url += encodeURIComponent(address);
                window.open(url);
              }
            }
          },
          title: {
            display: true,
            text: 'Transaction Utxos',
            font: {
              size: 20
            }
          },
          interaction: {
            mode: 'nearest',
            intersect: false
          },
          onHover: function(event, elements) {
            event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
          }
        }
      });
    }
    console.log(chartInstance)
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [inputs, outputs]);

  return (
    <div>
      <div className="text-center text-lg font-semibold mb-4">Diagram UTXO Simplified</div>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default DiagramTab;
