import React, { useState, useEffect, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Doughnut } from "react-chartjs-2"; // Ajouté pour le donut chart
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import scriptMappings from '../utils/scriptMapping';
import { QuestionMarkCircleIcon } from "@heroicons/react/20/solid";

// Enregistrement des composants Chart.js nécessaires
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const generateAppColors = (apps, theme) => {
  const baseColors = {
    light: [
      '#227777', // Couleur spécifique pour 'no-script'
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad',
      '#27ae60', '#2980b9', '#f1c40f', '#e67e22', '#6c3483'
    ],
    dark: [
      '#00efff', // Couleur spécifique pour 'no-script'
      '#60A5FA', '#4ADE80', '#F87171', '#FBBF24', '#A78BFA',
      '#34D399', '#FB923C', '#EF4444', '#2DD4BF', '#C084FC',
      '#4ADE80', '#60A5FA', '#FBBF24', '#FB923C', '#A78BFA'
    ]
  };
  
  const colors = {};
  apps.forEach((app, index) => {
    colors[app] = baseColors[theme][index % baseColors[theme].length];
  });
  
  return colors;
};

const isDataDistributionValid = (hourlyData) => {
  const maxCount = Math.max(...hourlyData);
  const minCount = Math.min(...hourlyData);
  const mean = hourlyData.reduce((sum, count) => sum + count, 0) / hourlyData.length;
  const variance = hourlyData.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / hourlyData.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  return cv >= 0.5 && maxCount / (minCount + 1) >= 3;
};

const estimateRegion = (hourlyData, totalDataPoints) => {
  if (totalDataPoints < 20) return "Insufficient data";
  if (!isDataDistributionValid(hourlyData)) return "Unable to determine region - activity distribution too uniform";

  let minActivitySum = Infinity;
  let sleepStartHourUTC = 0;
  for (let i = 0; i < 24; i++) {
    let windowSum = 0;
    for (let j = 0; j < 5; j++) {
      const hour = (i + j) % 24;
      windowSum += hourlyData[hour];
    }
    if (windowSum < minActivitySum) {
      minActivitySum = windowSum;
      sleepStartHourUTC = i;
    }
  }
  const estimatedOffset = (sleepStartHourUTC - 1 + 24) % 24;

  if (estimatedOffset >= 16 && estimatedOffset <= 23) return "Americas";
  if (estimatedOffset >= 0 && estimatedOffset <= 3) return "Europe and West Africa";
  if (estimatedOffset >= 3 && estimatedOffset <= 5) return "East Africa and Middle East";
  if (estimatedOffset >= 5 && estimatedOffset <= 7) return "South and Central Asia";
  if (estimatedOffset >= 8 && estimatedOffset <= 12) return "East Asia and Oceania";
  if (estimatedOffset >= 3 && estimatedOffset <= 11) return "Russia (East and West)";
  return "Unknown region";
};

const ActivityCharts = ({ detailsData }) => {
  const detectTheme = useCallback(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      return document.documentElement.classList.contains("dark") || 
             document.documentElement.classList.contains("vibrant") 
             ? "dark" 
             : "light";
    }
    return "light";
  }, []);

  const [theme, setTheme] = useState(detectTheme());
  const [showTooltip, setShowTooltip] = useState(false);

  const themeColors = {
    light: {
      text: "currentColor",
      bar: "#34A5E6",
      background: "#FFFFFF",
      gridLines: "#eaeaea",
    },
    dark: {
      text: "currentColor",
      bar: "#60A5FA",
      background: "#1F2937",
      gridLines: "#656565",
    }
  };

  useEffect(() => {
    const handleThemeChange = () => setTheme(detectTheme());
    handleThemeChange();
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [detectTheme]);

  if (!detailsData?.full_dataset) {
    return <p className="text-base-content">No data available.</p>;
  }

  const dataset = detailsData.full_dataset;
  const colorText = theme === "dark" ? "#f8f9fa" : "#212529";
  
  const getAppsInTransaction = (tx) => {
    if (!tx.scripts || !Array.isArray(tx.scripts) || tx.scripts.length === 0) {
      return ['normal'];
    }
    
    const apps = new Set();
    tx.scripts.forEach(scriptHash => {
      const appName = scriptMappings[scriptHash] || 'normal';
      apps.add(appName);
    });
    
    return Array.from(apps);
  };

  const transactionsWithApps = dataset.map(item => ({
    ...item,
    apps: getAppsInTransaction(item),
    date: new Date(item.timestamp * 1000).toISOString().split('T')[0],
    hour: new Date(item.timestamp * 1000).getUTCHours(),
    weekDay: new Date(item.timestamp * 1000).getUTCDay()
  }));

  const uniqueApps = ['normal', ...new Set(transactionsWithApps.flatMap(item => item.apps).filter(app => app !== 'normal'))];
  const appColors = generateAppColors(uniqueApps, theme);

  const countAppUsage = () => {
    const appCounts = {};
    transactionsWithApps.forEach(item => {
      item.apps.forEach(app => {
        appCounts[app] = (appCounts[app] || 0) + 1;
      });
    });
    
    return Object.entries(appCounts)
      .map(([app, count]) => ({ app, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getAllDates = () => {
    const timestamps = dataset.map(item => new Date(item.timestamp * 1000));
    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));
    
    const dateMap = new Map();
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, {});
      uniqueApps.forEach(app => {
        dateMap.get(dateStr)[app] = 0;
      });
    }
    
    transactionsWithApps.forEach(item => {
      const dateData = dateMap.get(item.date);
      if (dateData) {
        item.apps.forEach(app => {
          dateData[app] = (dateData[app] || 0) + 1;
        });
      }
    });
    
    return Array.from(dateMap.entries()).map(([date, appCounts]) => ({ 
      date, 
      ...appCounts,
      total: Object.values(appCounts).reduce((sum, count) => sum + count, 0)
    }));
  };

  const groupByHour = () => {
    const hourGroups = new Array(24).fill(0).map(() => ({ total: 0 }));
    uniqueApps.forEach(app => {
      hourGroups.forEach(hour => {
        hour[app] = 0;
      });
    });
    
    transactionsWithApps.forEach(item => {
      const hourData = hourGroups[item.hour];
      item.apps.forEach(app => {
        hourData[app] = (hourData[app] || 0) + 1;
        hourData.total += 1;
      });
    });
    
    return hourGroups.map((counts, hour) => ({ 
      hour: `${hour.toString().padStart(2, '0')}:00 UTC`, 
      ...counts 
    }));
  };

  const groupByWeekDay = () => {
    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekDayGroups = new Array(7).fill(0).map(() => ({ total: 0 }));
    
    uniqueApps.forEach(app => {
      weekDayGroups.forEach(day => {
        day[app] = 0;
      });
    });
    
    transactionsWithApps.forEach(item => {
      const dayData = weekDayGroups[item.weekDay];
      item.apps.forEach(app => {
        dayData[app] = (dayData[app] || 0) + 1;
        dayData.total += 1;
      });
    });
    
    return weekDays.map((day, index) => ({ 
      day, 
      ...weekDayGroups[index] 
    }));
  };

  const appUsage = countAppUsage();
  const hourlyData = groupByHour();
  const hourlyCountsOnly = hourlyData.map(h => h.total);
  const estimatedRegionResult = estimateRegion(hourlyCountsOnly, dataset.length);
  const dailyData = getAllDates();
  const weekdayData = groupByWeekDay();

  const hasMultipleApps = uniqueApps.length > 1;

  const formatUTCDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', { 
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'medium'
    }) + ' UTC';
  };

  const firstActivity = Math.min(...dataset.map(item => item.timestamp));
  const lastActivity = Math.max(...dataset.map(item => item.timestamp));

  const roundedBarOptions = {
    borderRadius: {
      topLeft: 1,
      topRight: 1,
      bottomLeft: 0,
      bottomRight: 0
    }
  };

  const stackedChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        ticks: { color: colorText },
        grid: { color: themeColors[theme].gridLines },
        stacked: true,
      },
      y: {
        ticks: { color: colorText },
        grid: { color: themeColors[theme].gridLines },
        stacked: true,
      }
    },
    plugins: {
      tooltip: {
        mode: 'index',
        callbacks: {
          label: function(context) {
            if (context.raw === 0) return null;
            return context.dataset.label + ': ' + context.raw;
          }
        }
      },
      legend: {
        position: 'top',
        labels: {
          color: colorText,
          font: { size: 12 },
        },
      }
    },
  };

  const globalChartOptions = {
    ...stackedChartOptions,
    barThickness: 2,
    plugins: {
      ...stackedChartOptions.plugins,
      tooltip: {
        mode: 'index',
        callbacks: {
          label: function(context) {
            if (context.raw === 0) return null;
            return context.dataset.label + ': ' + context.raw;
          }
        }
      }
    }
  };

  const donutChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    cutout: '70%', // Épaisseur du donut
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: colorText,
          font: { size: 14 },
          padding: 20,
          boxWidth: 20,
          usePointStyle: true, // Points ronds dans la légende
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleFont: { size: 16, weight: 'bold' },
        bodyFont: { size: 14 },
        padding: 12,
        cornerRadius: 8,
        borderWidth: 1,
        borderColor: theme === 'dark' ? '#60A5FA' : '#34A5E6',
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} transactions`;
          },
        },
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  };

  const createStackedChartData = (data, labelKey) => {
    const labels = data.map(item => item[labelKey]);
    
    const datasets = uniqueApps.map(app => ({
      label: app,
      data: data.map(item => item[app] || 0),
      backgroundColor: appColors[app],
      ...roundedBarOptions
    }));
    
    return {
      labels,
      datasets
    };
  };

  const createAppUsageChartData = () => ({
    labels: appUsage.map(item => item.app),
    datasets: [{
      label: 'Number of transactions',
      data: appUsage.map(item => item.count),
      backgroundColor: appUsage.map(item => appColors[item.app]),
      borderWidth: 2,
      borderColor: theme === 'dark' ? '#374151' : '#FFFFFF',
      hoverOffset: 10,
    }]
  });

  return (
    <div className="p-4 space-y-6 text-base-content">
      <div className="flex flex-col md:flex-row justify-between">
        <div><strong>First activity:</strong> {formatUTCDate(firstActivity)}</div>
        <div><strong>Last activity:</strong> {formatUTCDate(lastActivity)}</div>
        <div><strong>Total activities:</strong> {dataset.length}</div>
      </div>
      <div className="h-6"></div>
      <div className="w-full h-96">
        <h3 className="text-lg font-semibold">Global Activity (UTC)</h3>
        <p className="text-sm mb-4">The "Normal" category applies when no script is detected or the script is unknown.</p>
        <Bar 
          key={`global-${theme}`}
          data={createStackedChartData(dailyData, 'date')}
          options={globalChartOptions}
        />
      </div>
      {hasMultipleApps && (
        <>
          <div className="h-20"></div>
          <div className="w-full h-80">
            <h3 className="text-lg font-semibold mb-4">App Usage Frequency</h3>
            <Doughnut 
              key={`app-usage-${theme}`}
              data={createAppUsageChartData()}
              options={donutChartOptions}
            />
          </div>
        </>
      )}
      <div className="min-h-20"></div>
      
      <div className="flex flex-col md:flex-row pb-10 gap-10">
        <div className="w-full h-80">
          <h3 className="text-lg font-semibold mb-2">By Day of Week (UTC)</h3>
          <Bar 
            key={`weekday-${theme}`}
            data={createStackedChartData(weekdayData, 'day')}
            options={stackedChartOptions}
          />
        </div>
        <div className="w-full h-80">
          <h3 className="text-lg font-semibold mb-2">By Hour of Day (UTC)</h3>
          <Bar 
            key={`hourly-${theme}`}
            data={createStackedChartData(hourlyData, 'hour')}
            options={stackedChartOptions}
          />
        </div>
      </div>

      <div className="relative inline-block">
        <strong>Estimated Region <QuestionMarkCircleIcon
          className="w-5 h-5 inline-block align-middle cursor-pointer text-current hover:text-blue-500 mr-2 mb-1"
          onClick={() => setShowTooltip(!showTooltip)}
        /> :</strong><br /> {estimatedRegionResult}
        {showTooltip && (
          <div 
            className="absolute z-10 w-64 p-2 mt-2 text-sm text-current bg-base-100 border border-sky-300/30 rounded-lg shadow-lg tooltip"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            This estimation is based on UTC activity patterns and requires at least 20 data points with clearly active/inactive periods for a reliable prediction.
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCharts;