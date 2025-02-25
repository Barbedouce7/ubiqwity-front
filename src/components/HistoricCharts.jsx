import React, { useEffect, useRef, useContext, useState, useCallback } from 'react';
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
    const [theme, setTheme] = useState('light');

    // Détection du thème dynamique
    const detectTheme = useCallback(() => {
        if (typeof document !== "undefined" && document.documentElement) {
            if (document.documentElement.classList.contains("dark") || 
                document.documentElement.classList.contains("vibrant")) {
                return "dark";
            }
        }
        return "light";
    }, []);

    // Mettre à jour le thème dynamiquement
    useEffect(() => {
        const updateTheme = () => setTheme(detectTheme());
        updateTheme(); // Initialisation

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, [detectTheme]);

    const colorText = theme === "dark" ? "#ffffff" : "#000000";
    const gridColor = theme === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const tooltipBg = theme === "dark" ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';

    const dataPoints = data && typeof data === 'object' ? Object.values(data) : [];
    const isDetailedAvailable = dataPoints.length > 100;

    // Référence pour les epochs (début de l'epoch 541)
    const epochReferenceNumber = 541;
    const epochReferenceStart = new Date('2025-02-18T21:44:55Z').getTime();
    const epochDuration = 5 * 24 * 60 * 60 * 1000; // 5 jours en millisecondes

    const preferredTokens = [
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
        if (!/^[0-9a-f]{56,}$/i.test(tokenId)) return safeValue / 1_000_000;
        if (metadata?.decimals) return safeValue / Math.pow(10, metadata.decimals);
        return safeValue;
    };

    const generateColor = (token, index) => {
        if (token === 'lovelace') return '#36A2EB';
        const colors = ['#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#FF8A80', '#82B1FF'];
        return colors[index % colors.length];
    };

    const getEpochNumber = (timestamp) => {
        const timeDiff = timestamp - epochReferenceStart;
        return epochReferenceNumber + Math.floor(timeDiff / epochDuration);
    };

    const getCommonSamplePoints = (tokenDataMap) => {
        const allTimestamps = new Set();
        Object.values(tokenDataMap).forEach(points => {
            points.forEach(point => allTimestamps.add(point.x));
        });
        
        const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);
        if (sortedTimestamps.length <= 100) return sortedTimestamps;
        
        const commonPoints = [sortedTimestamps[0]];
        const step = Math.max(Math.floor(sortedTimestamps.length / 50), 1);
        for (let i = 1; i < sortedTimestamps.length - 1; i += step) {
            commonPoints.push(sortedTimestamps[i]);
        }
        commonPoints.push(sortedTimestamps[sortedTimestamps.length - 1]);
        return commonPoints;
    };

    const verticalLinePlugin = {
        id: 'verticalLine',
        beforeDraw: (chart) => {
            if (chart.tooltip?._active?.length) {
                const activePoint = chart.tooltip._active[0];
                const ctx = chart.ctx;
                const x = activePoint.element.x;
                const topY = chart.scales.y.top;
                const bottomY = chart.scales.y.bottom;
                
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 1;
                ctx.strokeStyle = gridColor;
                ctx.stroke();
                ctx.restore();
            }
        }
    };

    useEffect(() => {
        if (!dataPoints.length || !chartRef.current) return;

        const setupChart = async () => {
            try {
                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }

                const allTokens = new Set();
                dataPoints.forEach(point => {
                    if (point.balances && typeof point.balances === 'object') {
                        Object.keys(point.balances).forEach(token => allTokens.add(token));
                    }
                });

                await Promise.all(Array.from(allTokens).map(async token => {
                    if (!tokenMetadata[token] && token !== 'lovelace' && /^[0-9a-f]{56,}$/i.test(token)) {
                        try {
                            await fetchTokenData(token);
                        } catch (err) {
                            console.warn(`Failed to fetch metadata for token ${token}:`, err);
                        }
                    }
                }));

                const tokensWithNonZeroData = Array.from(allTokens).filter(token => 
                    dataPoints.some(point => Number(point.balances?.[token] ?? 0) > 0)
                );

                const preferredWithData = preferredTokens.filter(token => tokensWithNonZeroData.includes(token));
                const otherTokensWithData = tokensWithNonZeroData.filter(token => !preferredTokens.includes(token));
                const allSortedTokens = [...preferredWithData, ...otherTokensWithData].filter(Boolean);

                const tokenDataMap = {};
                allSortedTokens.forEach(token => {
                    const metadata = tokenMetadata[token] || {};
                    tokenDataMap[token] = dataPoints.map(point => ({
                        x: (point.timestamp || 0) * 1000,
                        y: adjustValueByDecimals(token, point.balances?.[token] ?? 0, metadata)
                    })).sort((a, b) => a.x - b.x);
                });

                let commonSamplePoints = chartType === 'simplified' ? getCommonSamplePoints(tokenDataMap) : [];

                const datasets = allSortedTokens.map((token, index) => {
                    const metadata = tokenMetadata[token] || {};
                    const color = generateColor(token, index);
                    let points = tokenDataMap[token];

                    if (chartType === 'simplified' && commonSamplePoints.length > 0) {
                        points = commonSamplePoints.map(timestamp => {
                            const closestPoint = points.reduce((prev, curr) => 
                                Math.abs(curr.x - timestamp) < Math.abs(prev.x - timestamp) ? curr : prev
                            );
                            return Math.abs(closestPoint.x - timestamp) < 24 * 60 * 60 * 1000 
                                ? { x: timestamp, y: closestPoint.y } 
                                : null;
                        }).filter(Boolean);
                    }

                    return {
                        label: resolveTokenLabel(token, metadata),
                        data: points,
                        borderColor: color,
                        backgroundColor: color,
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false,
                        hidden: !preferredWithData.includes(token),
                        stepped: 'before'
                    };
                });

                let minTime = Infinity;
                let maxTime = -Infinity;
                datasets.forEach(dataset => {
                    dataset.data.forEach(point => {
                        minTime = Math.min(minTime, point.x);
                        maxTime = Math.max(maxTime, point.x);
                    });
                });

                const firstEpochNum = getEpochNumber(minTime);
                const lastEpochNum = getEpochNumber(maxTime);
                const firstEpochStart = epochReferenceStart + ((firstEpochNum - epochReferenceNumber) * epochDuration);
                const lastEpochEnd = epochReferenceStart + ((lastEpochNum - epochReferenceNumber + 1) * epochDuration);

                const ctx = chartRef.current.getContext('2d');
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: { datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: { padding: { top: 40, bottom: 30 } },
                        scales: {
                            x: {
                                type: 'time',
                                time: { unit: 'day', stepSize: 1, displayFormats: { day: 'MMM d', hour: 'HH:mm' } },
                                position: 'top',
                                grid: { drawOnChartArea: true, color: gridColor },
                                ticks: { color: colorText }
                            },
                            epoch: {
                                type: 'time',
                                position: 'bottom',
                                grid: { drawOnChartArea: false, drawTicks: true, drawBorder: true, color: gridColor },
                                ticks: {
                                    autoSkip: false,
                                    callback: value => `Epoch ${getEpochNumber(value)}`,
                                    color: colorText,
                                },
                                min: firstEpochStart,
                                max: lastEpochEnd,
                                afterBuildTicks: (axis) => {
                                    axis.ticks = [];
                                    for (let epochNum = firstEpochNum; epochNum <= lastEpochNum; epochNum++) {
                                        axis.ticks.push({
                                            value: epochReferenceStart + ((epochNum - epochReferenceNumber) * epochDuration)
                                        });
                                    }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                min: 0,
                                ticks: { callback: value => value.toLocaleString(), color: colorText },
                                grid: { color: gridColor }
                            }
                        },
                        plugins: {
                            verticalLine: {},
                            zoom: {
                                zoom: {
                                    wheel: { enabled: true },
                                    pinch: { enabled: true },
                                    mode: 'xy',
                                },
                                pan: { enabled: true, mode: 'xy' }
                            },
                            legend: {
                                position: 'top',
                                align: 'start',
                                labels: { 
                                    usePointStyle: true, 
                                    padding: 25, 
                                    font: { size: 14 },
                                    color: colorText 
                                }
                            },
                            tooltip: {
                                mode: 'index',
                                axis: 'x',
                                intersect: false,
                                backgroundColor: tooltipBg,
                                titleColor: colorText,
                                bodyColor: colorText,
                                footerColor: colorText,
                                callbacks: {
                                    label: tooltipItem => `${tooltipItem.dataset.label}: ${tooltipItem.raw.y.toLocaleString()}`,
                                    footer: tooltipItems => tooltipItems.length ? `Epoch: ${getEpochNumber(tooltipItems[0].parsed.x)}` : ''
                                }
                            }
                        },
                    },
                    plugins: [verticalLinePlugin]
                });

                chartRef.current.addEventListener('dblclick', () => {
                    if (chartInstance.current) {
                        chartInstance.current.resetZoom();
                        chartInstance.current.options.scales.y.min = 0;
                        chartInstance.current.options.scales.epoch.min = firstEpochStart;
                        chartInstance.current.options.scales.epoch.max = lastEpochEnd;
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
            }
            if (chartRef.current) {
                chartRef.current.removeEventListener('dblclick', () => {});
            }
        };
    }, [data, tokenMetadata, fetchTokenData, chartType, theme, colorText, gridColor, tooltipBg]);

    if (!data || dataPoints.length === 0) {
        return <div className="w-full p-4 text-center text-base-content">No data available to display the chart.</div>;
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
            <div className="text-xs text-base-content mt-4 text-center">
                Use scroll wheel or pinch to zoom • Double-click to reset zoom • Click on legend to toggle tokens
            </div>
        </div>
    );
};

export default HistoricChart;