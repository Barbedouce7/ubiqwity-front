import React, { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import { SankeyController, Flow } from "chartjs-chart-sankey";

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
      return quantity;
    };

    const links = [];

    outputs.forEach((output) => {
      if (!output.address || !Array.isArray(output.amount)) return;

      output.amount.forEach((outAmt) => {
        if (!outAmt.unit || isNaN(parseInt(outAmt.quantity, 10))) return;

        let remainingQuantity = parseInt(outAmt.quantity, 10);
        const units = [];

        inputs.forEach((input) => {
          if (!input.address || !Array.isArray(input.amount) || input.address === output.address) return;

          const matchingInputAmt = input.amount.find((inAmt) => inAmt.unit === outAmt.unit);
          if (matchingInputAmt) {
            const inputQuantity = parseInt(matchingInputAmt.quantity, 10);

            if (inputQuantity > 0) {
              const flowQuantity = Math.min(remainingQuantity, inputQuantity);
              const flow = convertToFlow(flowQuantity);

              let existingLink = links.find(link => link.from === input.address && link.to === output.address);
              if (existingLink) {
                existingLink.flow += flow;
                existingLink.units.push({ unit: outAmt.unit, quantity: flowQuantity });
              } else {
                links.push({
                  from: input.address,
                  to: output.address,
                  flow: flow,
                  units: [{ unit: outAmt.unit, quantity: flowQuantity }]
                });
              }

              remainingQuantity -= flowQuantity;
              if (remainingQuantity <= 0) return false; // Breaks out of forEach loop in JS
            }
          }
        });
        
        if (remainingQuantity > 0) {
          console.log(`Remaining quantity for ${outAmt.unit} at ${output.address}: ${remainingQuantity}`);
        }
      });
    });

    if (links.length === 0) {
      console.warn("No asset transfers detected for the Sankey Chart");
      return;
    }

    // Setup chart data with new options
    const data = {
      datasets: [{
        data: links,
        colorFrom: "#007BFF", // Bright blue for better visibility
        colorTo: "#FFA500",   // Orange for better visibility
        color: '#ffffff',
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

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [inputs, outputs]);

  return (
    <div>
      <div className="text-center text-lg font-semibold mb-4">Diagram UTXO Transferts</div>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default DiagramTab;