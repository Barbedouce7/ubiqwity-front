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
    const [chartType, setChartType] = useState('simplified');

    const dataPoints = data && typeof data === 'object' ? Object.values(data) : [];
    const isDetailedAvailable = dataPoints.length > 100;

    const defaultVisibleTokens = [
        'lovelace',
        '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd615368656e4d6963726f555344',
        '8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61446a65644d6963726f555344',
        'Staked INDY'
    ];

    const resolveTokenLabel = (tokenId, metadata) => {
        if (!tokenId) return 'Unknown Token';
        if (tokenId === 'lovelace') return 'ADA';
        if (!/^[0-9a-f]{56,}$/i.test(tokenId)) return tokenId;
        return metadata?.ticker || metadata?.name || tokenId;
    };

    const adjustValueByDecimals = (tokenId, value, metadata) => {
        const safeValue = Number(value) || 0;
        if (tokenId === 'lovelace') return safeValue / 1_000_000;
        // Tokens avec noms lisibles : diviser par 1_000_000
        if (!/^[0-9a-f]{56,}$/i.test(tokenId)) return safeValue / 1_000_000;
        if (metadata?.decimals) return safeValue / Math.pow(10, metadata.decimals);
        return safeValue;
    };

    const generateColor = (token, index) => {
        if (token === 'lovelace') return '#36A2EB';
        const colors = ['#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#FF8A80', '#82B1FF'];
        return colors[index % colors.length];
    };

    const simplifyData = (dataPoints) => {
        if (dataPoints.length <= 100) return dataPoints;
        const simplified = [];
        const step = Math.max(Math.floor(dataPoints.length / 50), 1);
        simplified.push(dataPoints[0]);
        for (let i = 1; i < dataPoints.length - 1; i++) {
            if (i % step === 0 || 
                Math.abs(dataPoints[i].y - dataPoints[i - 1].y) > 0 || 
                (i < dataPoints.length - 1 && dataPoints[i].y !== dataPoints[i + 1].y)) {
                simplified.push(dataPoints[i]);
            }
        }
        simplified.push(dataPoints[dataPoints.length - 1]);
        return simplified;
    };

    useEffect(() => {
        if (!dataPoints.length || !chartRef.current) return;

        const setupChart = async () => {
            try {
                if (chartInstance.current) {
                    chartInstance.current.destroy();
                    chartInstance.current = null;
                }

                const allTokens = new Set();
                dataPoints.forEach(point => {
                    if (point.balances && typeof point.balances === 'object') {
                        Object.keys(point.balances).forEach(token => allTokens.add(token));
                    }
                });

                const tokenPromises = Array.from(allTokens).map(async token => {
                    if (!tokenMetadata[token] && token !== 'lovelace' && /^[0-9a-f]{56,}$/i.test(token)) {
                        try {
                            await fetchTokenData(token);
                        } catch (err) {
                            console.warn(`Failed to fetch metadata for token ${token}:`, err);
                        }
                    }
                    return token;
                });

                await Promise.all(tokenPromises);

                const tokensWithData = Array.from(allTokens).filter(token =>
                    dataPoints.some(point => point.balances?.[token] !== undefined && point.balances[token] !== 0)
                );

                const allSortedTokens = [
                    ...defaultVisibleTokens,
                    ...tokensWithData.filter(token => !defaultVisibleTokens.includes(token))
                ].filter(Boolean);

                const lastValues = {};
                const sortedPoints = dataPoints.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                const lastPoint = sortedPoints[0] || {};
                allSortedTokens.forEach(token => {
                    lastValues[token] = lastPoint.balances?.[token] || 0;
                });

                const datasets = allSortedTokens.map((token, index) => {
                    const metadata = tokenMetadata[token] || {};
                    const color = generateColor(token, index);
                    // Ne pas ajouter de point futur pour éviter la fermeture horizontale
                    let points = dataPoints.map(point => ({
                        x: (point.timestamp || 0) * 1000,
                        y: adjustValueByDecimals(token, point.balances?.[token] ?? 0, metadata)
                    }));

                    if (chartType === 'simplified') {
                        points = simplifyData(points);
                    }

                    if (points.every(point => point.y === 0) && !defaultVisibleTokens.includes(token)) {
                        return null;
                    }

                    return {
                        label: resolveTokenLabel(token, metadata),
                        data: points,
                        borderColor: color,
                        backgroundColor: color,
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false,
                        hidden: !defaultVisibleTokens.includes(token)
                    };
                }).filter(dataset => dataset !== null);

                const ctx = chartRef.current.getContext('2d');
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: { datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: { top: 40 } },
                        scales: {
                            x: {
                                type: 'time',
                                time: { unit: 'day', stepSize: 1, displayFormats: { day: 'MMM d', hour: 'HH:mm' } }
                            },
                            y: {
                                beginAtZero: true,
                                min: 0,
                                ticks: { callback: value => value.toLocaleString() }
                            }
                        },
                        interaction: { 
                            mode: 'index', // Alignement vertical des tooltips
                            axis: 'x', 
                            intersect: false 
                        },
                        elements: { line: { stepped: 'before' }, point: { radius: 2, hoverRadius: 6, hitRadius: 8 } },
                        plugins: {
                            zoom: {
                                limits: { x: { min: 'original', max: 'original' }, y: { min: 0, maxRange: Infinity } },
                                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, drag: { enabled: false } },
                                pan: { enabled: false },
                                onZoom: ({ chart }) => {
                                    chart.options.scales.y.min = 0;
                                    chart.update('none');
                                }
                            },
                            legend: {
                                position: 'top',
                                align: 'start',
                                labels: { usePointStyle: true, padding: 25, font: { size: 14 } }
                            },
                            tooltip: {
                                mode: 'index', // Afficher toutes les valeurs à la même position x
                                axis: 'x',
                                intersect: false,
                                callbacks: {
                                    label: tooltipItem => `${tooltipItem.dataset.label}: ${tooltipItem.raw.y.toLocaleString()}`
                                }
                            }
                        }
                    }
                });

                chartRef.current.addEventListener('dblclick', () => {
                    if (chartInstance.current) {
                        chartInstance.current.resetZoom();
                        chartInstance.current.options.scales.y.min = 0;
                        chartInstance.current.update();
                    }
                });
            } catch (error) {
                console.error('Error setting up chart:', error);
            }
        };

        setupChart();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
            if (chartRef.current) {
                chartRef.current.removeEventListener('dblclick', () => {});
            }
        };
    }, [data, tokenMetadata, fetchTokenData, chartType]);

    if (!data || dataPoints.length === 0) {
        return (
            <div className="w-full p-4 text-center text-gray-500">
                No data available to display the chart.
            </div>
        );
    }

    return (
        <div className="w-full p-4">
            <div className="flex justify-between items-center mb-4">
                <div className="text-lg font-bold">Balance History</div>
                {isDetailedAvailable && (
                    <label className="flex items-center cursor-pointer gap-2">
                        <span className="text-sm">Simplified</span>
                        <input
                            type="checkbox"
                            className="toggle"
                            checked={chartType === 'detailed'}
                            onChange={(e) => setChartType(e.target.checked ? 'detailed' : 'simplified')}
                        />
                        <span className="text-sm">Detailed</span>
                    </label>
                )}
            </div>
            <div className="relative w-full md:w-4/5 mx-auto" style={{ height: '600px', minHeight: '600px' }}>
                <canvas ref={chartRef} />
            </div>
            <div className="text-xs text-gray-500 mt-4 text-center">
                Use scroll wheel or pinch to zoom • Double-click to reset zoom • Click on legend to toggle tokens
            </div>
        </div>
    );
};

export default HistoricChart;