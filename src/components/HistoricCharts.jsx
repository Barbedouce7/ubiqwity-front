import React, { useEffect, useRef, useContext  } from 'react';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { TokenContext } from '../utils/TokenContext';


const HistoricChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const { tokenMetadata, fetchTokenData } = useContext(TokenContext);

    // Fonction utilitaire pour résoudre le label d'un token
    const resolveTokenLabel = (metadata) => {
        if (metadata.ticker) return metadata.ticker;
        if (metadata.name) return metadata.name;
        return metadata.policy || 'Unknown Token';
    };

    // Fonction pour ajuster la valeur selon les décimales
    const adjustValueByDecimals = (value, decimals) => {
        return value / Math.pow(10, decimals);
    };

    useEffect(() => {
        if (!data || !chartRef.current) return;

        const setupChart = async () => {
            // Clean up any existing chart
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            // Collect all unique tokens
            const allTokens = new Set();
            data.forEach(point => {
                Object.keys(point.balances).forEach(token => allTokens.add(token));
            });

            // Fetch metadata for all tokens if not already in context
            const tokenPromises = Array.from(allTokens).map(async token => {
                if (!tokenMetadata[token]) {
                    await fetchTokenData(token);
                }
                return token;
            });

            await Promise.all(tokenPromises);

            // Construire les datasets en utilisant les métadonnées
            const datasets = Array.from(allTokens).map(token => {
                const metadata = tokenMetadata[token] || { decimals: 0 };
                
                return {
                    label: resolveTokenLabel(metadata),
                    data: data.map(point => ({
                        x: point.timestamp * 1000,
                        y: adjustValueByDecimals(point.balances[token] || 0, metadata.decimals)
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
                                    return `${label}: ${value.toLocaleString()}`;
                                }
                            }
                        }
                    }
                }
            });
        };

        setupChart();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [data, tokenMetadata, fetchTokenData]);

    return (
        <div className="w-full p-4 bg-base-100">
            <div className="text-lg font-bold mb-4">Balance History</div>
            <div className="relative w-full">
                <canvas ref={chartRef} />
            </div>
        </div>
    );
};

export default HistoricChart;