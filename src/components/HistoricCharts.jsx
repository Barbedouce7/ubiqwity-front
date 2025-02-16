import React, { useEffect, useRef, useContext, useState } from 'react';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import { TokenContext } from '../utils/TokenContext';

Chart.register(zoomPlugin);

const HistoricChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const { tokenMetadata, fetchTokenData } = useContext(TokenContext);
    const [chartType, setChartType] = useState('simplified'); // 'simplified' or 'detailed'

    const defaultVisibleTokens = ['lovelace', '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd615368656e4d6963726f555344', '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344'];

    // Utility functions remain unchanged
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
        if (token === 'lovelace') return '#36A2EB';
        const colors = ['#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#FF8A80', '#82B1FF'];
        return colors[index % colors.length];
    };

    const simplifyData = (dataPoints) => {
        const n = Math.max(Math.floor(dataPoints.length / 50), 1); // Show at most 50 points
        return dataPoints.filter((_, index) => index % n === 0 || index === dataPoints.length - 1);
    };

    useEffect(() => {
        if (!data || !chartRef.current) return;

        const setupChart = async () => {
            if (chartInstance.current) chartInstance.current.destroy();

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

            // Filter tokens to only those with data
            const tokensWithData = Array.from(allTokens).filter(token => {
                return Object.values(data).some(point => point.balances[token] !== undefined && point.balances[token] !== 0);
            });

            // Combine default visible tokens with tokens that have data, ensuring defaults come first
            const allSortedTokens = [...defaultVisibleTokens, ...tokensWithData.filter(token => !defaultVisibleTokens.includes(token))];

            const lastValues = {};
            allSortedTokens.forEach(token => {
                const lastPoint = Object.values(data).sort((a, b) => b.timestamp - a.timestamp)[0];
                lastValues[token] = lastPoint.balances[token] || 0;
            });

            const datasets = allSortedTokens.map((token, index) => {
                const metadata = tokenMetadata[token] || {};
                const color = generateColor(token, index);
                let dataPoints = Object.values(data).map(point => ({
                    x: point.timestamp * 1000,
                    y: adjustValueByDecimals(token, point.balances[token] || 0, metadata)
                }));
                dataPoints.push({
                    x: new Date().getTime(),
                    y: adjustValueByDecimals(token, lastValues[token], metadata)
                });

                // Simplify data if needed
                if (chartType === 'simplified') {
                    dataPoints = simplifyData(dataPoints);
                }

                // Only include tokens with data
                if (dataPoints.every(point => point.y === 0)) {
                    return null; // Skip tokens with all zero values
                }

                return {
                    label: resolveTokenLabel(token, metadata),
                    data: dataPoints,
                    borderColor: color,
                    backgroundColor: color,
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false,
                    hidden: !defaultVisibleTokens.includes(token)
                };
            }).filter(dataset => dataset !== null); // Filter out null entries

            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: { datasets },
                options: {
                    responsive: true,
                    layout: {
                        padding: {
                            top: 30 // Margin between legend and chart
                        }
                    },
                    scales: {
                        x: { 
                            type: 'time', 
                            time: { 
                                unit: 'day', 
                                stepSize: 1, 
                                displayFormats: { day: 'MMM d', hour: 'HH:mm' } 
                            } 
                        },
                        y: { 
                            beginAtZero: true, 
                            min: 0, 
                            ticks: { 
                                callback: value => value.toLocaleString() 
                            }
                        }
                    },
                    interaction: { mode: 'nearest', axis: 'x', intersect: false },
                    elements: { line: { stepped: 'before' }, point: { radius: 2, hoverRadius: 6, hitRadius: 8 } },
                    plugins: {
                        zoom: {
                            limits: { x: { min: 'original', max: 'original' }, y: { min: 0, maxRange: Infinity } },
                            zoom: {
                                wheel: { enabled: true },
                                pinch: { enabled: true },
                                drag: { enabled: false },
                            },
                            pan: { enabled: false },
                            onZoom: ({ chart }) => {
                                chart.options.scales.y.min = 0; // Reset min to 0 after zoom
                                chart.update('none');
                            }
                        },
                        legend: { 
                            position: 'top', 
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
                                label: tooltipItem => `${tooltipItem.dataset.label}: ${tooltipItem.raw.y.toLocaleString()}` 
                            }
                        }
                    }
                }
            });

            // Double-click to reset zoom
            chartRef.current.addEventListener('dblclick', () => {
                chartInstance.current.resetZoom();
                chartInstance.current.options.scales.y.min = 0;
                chartInstance.current.update();
            });
        };

        setupChart();

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
            if (chartRef.current) {
                chartRef.current.removeEventListener('dblclick', () => {});
            }
        };
    }, [data, tokenMetadata, fetchTokenData, chartType]);

    return (
        <div className="w-full p-4 bg-base-100">
            <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-bold">Balance History</div>
                <div>
                    <button onClick={() => setChartType('simplified')} className="mr-2 mb-2 px-3 py-1 bg-blue-500 text-white rounded">Simplified View</button>
                    <button onClick={() => setChartType('detailed')} className="px-3 mb-2 py-1 bg-sky-500 text-white rounded">Detailed View</button>
                </div>
            </div>
            <div className="relative w-full md:w-4/5 mx-auto">
                <canvas ref={chartRef} />
            </div>
            <div className="text-xs text-gray-500 mt-2">
                Use scroll wheel or pinch to zoom • Double-click to reset zoom • Click on legend to toggle tokens
            </div>
        </div>
    );
};

export default HistoricChart;