import React, { useState, useEffect, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

  const themeColors = {
    light: {
      text: "#111111",        // gray-800
      bar: "#34A5E6",        // bleu original
      background: "#FFFFFF",  // blanc
      gridLines: "#eaeaea",   // gray-200
    },
    dark: {
      text: "#eeeeee",        // gray-200
      bar: "#60A5FA",        // bleu plus clair pour dark mode
      background: "#1F2937",  // gray-800
      gridLines: "#656565",   // gray-600
    }
  };

  useEffect(() => {
    const handleThemeChange = () => setTheme(detectTheme());
    handleThemeChange(); // Mise à jour immédiate
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [detectTheme]);

  if (!detailsData?.full_dataset) {
    return <p className="text-base-content">No data available.</p>;
  }

  const dataset = detailsData.full_dataset;

  const getAllDates = () => {
    const timestamps = dataset.map(item => new Date(item.timestamp * 1000));
    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));
    const dateMap = new Map();
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      dateMap.set(d.toISOString().split('T')[0], 0);
    }
    dataset.forEach(item => {
      const date = new Date(item.timestamp * 1000).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    return Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));
  };

  const groupByHour = () => {
    const hourGroups = new Array(24).fill(0);
    dataset.forEach(item => {
      const hour = new Date(item.timestamp * 1000).getUTCHours();
      hourGroups[hour]++;
    });
    return hourGroups.map((count, hour) => ({ 
      hour: `${hour.toString().padStart(2, '0')}:00 UTC`, 
      count 
    }));
  };

  const groupByWeekDay = () => {
    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekDayGroups = new Array(7).fill(0);
    dataset.forEach(item => {
      const day = new Date(item.timestamp * 1000).getUTCDay();
      weekDayGroups[day]++;
    });
    return weekDays.map((day, index) => ({ day, count: weekDayGroups[index] }));
  };

  const hourlyData = groupByHour();
  const hourlyCountsOnly = hourlyData.map(h => h.count);
  const estimatedRegion = estimateRegion(hourlyCountsOnly, dataset.length);

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

  const createChartData = (labels, values, label) => ({
    labels,
    datasets: [{ 
      label, 
      data: values, 
      backgroundColor: themeColors[theme].bar,
      borderRadius: 22 
    }],
  });

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: themeColors[theme].text,
          font: { size: 14 },
        },
      },
      tooltip: {
        backgroundColor: themeColors[theme].background,
        titleColor: themeColors[theme].text,
        bodyColor: themeColors[theme].text,
      },
    },
    scales: {
      x: {
        ticks: { color: themeColors[theme].text },
        grid: { color: themeColors[theme].gridLines },
      },
      y: {
        ticks: { color: themeColors[theme].text },
        grid: { color: themeColors[theme].gridLines },
      },
    },
  };

  return (
    <div className="p-4 space-y-6 text-base-content">
      <div className="flex flex-col md:flex-row justify-between">
        <div><strong>First activity:</strong> {formatUTCDate(firstActivity)}</div>
        <div><strong>Last activity:</strong> {formatUTCDate(lastActivity)}</div>
        <div><strong>Total activities:</strong> {dataset.length}</div>
      </div>

     {/*
      <div className="relative inline-block">
        <strong>Estimated Region <QuestionMarkCircleIcon
          className="w-5 h-5 inline-block align-middle cursor-pointer text-gray-500 hover:text-blue-500 mr-2 mb-1"
          onClick={() => setShowTooltip(!showTooltip)}
        /> :</strong><br /> {estimatedRegion}
        {showTooltip && (
          <div 
            className="absolute z-10 w-64 p-2 mt-2 text-sm text-gray-700 bg-base-100 border border-sky-300/30 rounded-lg shadow-lg tooltip"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            This estimation is based on UTC activity patterns and requires at least 20 data points with clearly active/inactive periods for a reliable prediction.
          </div>
        )}
      </div>
      */}
      
      <div className="w-full h-80">
        <h3 className="text-lg font-semibold mb-4">Global Activity (UTC)</h3>
        <Bar 
          key={`global-${theme}`} // Forcer le re-rendu
          data={createChartData(getAllDates().map(d => d.date), getAllDates().map(d => d.count), "Number of activities")} 
          options={chartOptions}
        />
      </div>
      <div className="min-h-20"></div>
      <div className="flex flex-col md:flex-row pb-10 gap-10">
        <div className="w-full h-80">
          <h3 className="text-lg font-semibold mb-2">By Day of Week (UTC)</h3>
          <Bar 
            key={`weekday-${theme}`} // Forcer le re-rendu
            data={createChartData(groupByWeekDay().map(d => d.day), groupByWeekDay().map(d => d.count), "Number of activities")} 
            options={chartOptions}
          />
        </div>
        <div className="w-full h-80">
          <h3 className="text-lg font-semibold mb-2">By Hour of Day (UTC)</h3>
          <Bar 
            key={`hourly-${theme}`} // Forcer le re-rendu
            data={createChartData(hourlyData.map(d => d.hour), hourlyData.map(d => d.count), "Number of activities")} 
            options={chartOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default ActivityCharts;