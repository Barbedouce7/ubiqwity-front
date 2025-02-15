import React, { useEffect, useRef, useContext } from 'react';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import { TokenContext } from '../utils/TokenContext';

Chart.register(zoomPlugin);

const HistoricChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const { tokenMetadata, fetchTokenData } = useContext(TokenContext);

    const resolveTokenLabel = (tokenId, metadata) => {
        if (tokenId === 'lovelace') return 'ADA';
        
        if (metadata) {
            if (metadata.ticker) return metadata.ticker;
            if (metadata.name) return metadata.name;
            return metadata.policy || 'Unknown Token';
        }
        
        return tokenId.substring(0, 20) + '...';
    };

    const adjustValueByDecimals = (tokenId, value, metadata) => {
        if (tokenId === 'lovelace') return value / 1_000_000;
        
        if (metadata && metadata.decimals) {
            return value / Math.pow(10, metadata.decimals);
        }
        
        return value;
    };

    const generateColor = (token, index) => {
        if (token === 'lovelace') {
            return '#36A2EB';
        }
        
        const colors = [
            '#FF6384', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', 
            '#C9CBCF', '#FF8A80', '#82B1FF'
        ];
        return colors[index % colors.length];
    };

    useEffect(() => {
        if (!data || !chartRef.current) return;

        const setupChart = async () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const allTokens = new Set();
            Object.values(data).forEach(point => {
                Object.keys(point.balances).forEach(token => allTokens.add(token.toLowerCase()));
            });

            const tokenPromises = Array.from(allTokens).map(async token => {
                if (!tokenMetadata[token] && token !== 'lovelace') {
                    await fetchTokenData(token);
                }
                return token;
            });

            await Promise.all(tokenPromises);

            const sortedTokens = Array.from(allTokens).sort((a, b) => {
                if (a === 'lovelace') return -1;
                if (b === 'lovelace') return 1;
                return 0;
            });

            // Trouver la dernière valeur pour chaque token
            const lastValues = {};
            sortedTokens.forEach(token => {
                const lastPoint = Object.values(data)
                    .sort((a, b) => b.timestamp - a.timestamp)[0];
                lastValues[token] = lastPoint.balances[token] || 0;
            });

            const datasets = sortedTokens.map((token, index) => {
                const metadata = tokenMetadata[token];
                const color = generateColor(token, index);
                
                // Créer les points de données, incluant le point final
                const dataPoints = Object.values(data)
                    .map(point => ({
                        x: point.timestamp * 1000,
                        y: adjustValueByDecimals(
                            token,
                            point.balances[token] || 0,
                            metadata
                        )
                    }));

                // Ajouter un point final avec la dernière valeur connue
                dataPoints.push({
                    x: new Date().getTime(),
                    y: adjustValueByDecimals(
                        token,
                        lastValues[token],
                        metadata
                    )
                });
                
                return {
                    label: resolveTokenLabel(token, metadata),
                    data: dataPoints,
                    borderColor: color,
                    backgroundColor: color,
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                };
            });

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
                                    hour: 'HH:mm'
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => value.toLocaleString()
                            }
                        }
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
                            radius: 2,
                            hoverRadius: 6,
                            hitRadius: 8
                        }
                    },
                    plugins: {
                        zoom: {
                            limits: {
                                x: { min: 'original', max: 'original' },
                                y: { min: 'original', max: 'original' }
                            },
                            zoom: {
                                wheel: {
                                    enabled: true,
                                    modifierKey: 'ctrl'
                                },
                                pinch: {
                                    enabled: true
                                },
                                mode: 'xy',
                                onZoomComplete: ({ chart }) => {
                                    // Ajouter un indicateur visuel de zoom
                                    const isZoomed = chart.getZoomLevel() > 1;
                                    chart.canvas.style.cursor = isZoomed ? 'zoom-out' : 'auto';
                                }
                            },
                            pan: {
                                enabled: true,
                                mode: 'xy'
                            }
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        },
                        tooltip: {
                            mode: 'nearest',
                            axis: 'x',
                            intersect: false,
                            callbacks: {
                                label: function(tooltipItem) {
                                    const value = tooltipItem.raw.y;
                                    return `${tooltipItem.dataset.label}: ${value.toLocaleString()}`;
                                }
                            }
                        }
                    }
                }
            });

            // Ajouter un double-clic pour réinitialiser le zoom
            chartRef.current.addEventListener('dblclick', () => {
                chartInstance.current.resetZoom();
                chartInstance.current.canvas.style.cursor = 'auto';
            });
        };

        setupChart();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            if (chartRef.current) {
                chartRef.current.removeEventListener('dblclick', () => {});
            }
        };
    }, [data, tokenMetadata, fetchTokenData]);

    return (
        <div className="w-full p-4 bg-base-100">
            <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-bold">Balance History</div>
            </div>
            <div className="relative w-full">
                <canvas ref={chartRef} />
            </div>
            <div className="text-xs text-gray-500 mt-2">
                Ctrl + Scroll to zoom • Double-click to reset • Drag to pan
            </div>
        </div>
    );
};

export default HistoricChart;