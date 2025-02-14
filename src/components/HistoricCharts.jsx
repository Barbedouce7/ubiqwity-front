import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const WalletChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    useEffect(() => {
        if (!data || !chartRef.current) return;

        // Clean up any existing chart
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Prepare datasets from the wallet data
const allTokens = new Set();
data.forEach(point => {
    Object.keys(point.balances).forEach(token => allTokens.add(token));
});

// Construire les datasets en parcourant tous les tokens trouvés
const datasets = Array.from(allTokens).map(token => {
    return {
        label: token,
        data: data.map(point => ({
            x: point.timestamp * 1000, // Convert to milliseconds
            y: point.balances[token] || 0 // Si le token n'existe pas dans une entrée, mettre 0
        })),
        borderWidth: 2,
        tension: 0.1,
        fill: false
    };
});

        // Create new chart
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            stepSize: 1,
                            displayFormats: {
                                day: 'MMM d',
                                hour: 'hA'
                            }
                        },
                        title: {
                            display: false,
                            text: 'Time'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: false,
                            text: 'Value'
                        }
                    },
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                elements: {
                    line: {
                        stepped: 'before'
                    },
                    point: {
                        radius: 3,
                        hoverRadius: 8,
                        hitRadius: 10
                    }
                },
                plugins: {
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: false
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        }
                    },
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false,
                        callbacks: {
                            label: function(tooltipItem) {
                                const dataset = tooltipItem.dataset;
                                const label = dataset.label || '';
                                const value = tooltipItem.raw.y;
                                return `${label}: ${value}`;
                            },
                            afterLabel: function(tooltipItem) {
                            	  const dataset = tooltipItem.dataset;
                                const dateX = tooltipItem.raw.x;
                                let tooltipText = '';
                                return tooltipText;
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data]);

    return (
        <div className="w-full p-4 bg-base-100">
            <div className="text-lg font-bold mb-4">Wallet Balance History</div>
            <div className="relative w-full">
                <canvas ref={chartRef} />
            </div>
        </div>
    );
};

export default WalletChart;