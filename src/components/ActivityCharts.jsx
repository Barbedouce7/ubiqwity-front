import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const isDataDistributionValid = (hourlyData) => {
  // On vérifie qu'il y a au moins une heure avec peu d'activité (potentiel sommeil)
  // et au moins une heure avec beaucoup d'activité
  const maxCount = Math.max(...hourlyData);
  const minCount = Math.min(...hourlyData);
  
  // Calculer l'écart-type pour voir si la distribution est assez variée
  const mean = hourlyData.reduce((sum, count) => sum + count, 0) / hourlyData.length;
  const variance = hourlyData.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / hourlyData.length;
  const stdDev = Math.sqrt(variance);
  
  // Le coefficient de variation (CV) nous aide à déterminer si la distribution est trop uniforme
  const cv = stdDev / mean;
  
  // On veut un CV d'au moins 0.5 pour considérer que la distribution n'est pas trop uniforme
  // et un ratio max/min d'au moins 3 pour avoir un contraste clair entre périodes actives/inactives
  return cv >= 0.5 && (maxCount / (minCount + 1) >= 3);
};

const estimateRegion = (timeDifference, hourlyData, totalDataPoints) => {
  // Vérifier qu'il y a assez de données (au moins 100 points)
  if (totalDataPoints < 20) {
    return "Insufficient data";
  }

  // Vérifier que la distribution des données est valide
  if (!isDataDistributionValid(hourlyData)) {
    return "Unable to determine region - activity pattern too uniform";
  }

  // Si les garde-fous sont passés, on peut estimer la région
  if (timeDifference >= -10 && timeDifference <= -3) return "Americas";
  if (timeDifference >= 0 && timeDifference <= 3) return "Europe and West Africa";
  if (timeDifference >= 3 && timeDifference <= 5) return "East Africa and Middle East";
  if (timeDifference >= 5 && timeDifference <= 7) return "South and Central Asia";
  if (timeDifference >= 7 && timeDifference <= 12) return "East Asia and Oceania";
  if (timeDifference >= 3 && timeDifference <= 12) return "Russia (East and West)";
  return "Unknown region";
};

const ActivityCharts = ({ detailsData }) => {
  if (!detailsData?.full_dataset) {
    return <p>No data available.</p>;
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
      const hour = new Date(item.timestamp * 1000).getHours();
      hourGroups[hour]++;
    });
    return hourGroups.map((count, hour) => ({ hour: `${hour}h`, count }));
  };

  const groupByWeekDay = () => {
    const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekDayGroups = new Array(7).fill(0);
    dataset.forEach(item => {
      const day = new Date(item.timestamp * 1000).getDay();
      weekDayGroups[day]++;
    });
    return weekDays.map((day, index) => ({ day, count: weekDayGroups[index] }));
  };

  const hourlyData = groupByHour();
  const sleepStartUTC = hourlyData.reduce((min, curr, idx) => 
    curr.count < min.count ? { count: curr.count, hour: idx } : min, 
    { count: Infinity, hour: 0 }
  ).hour;
  
  const timeDifference = (sleepStartUTC - 0 + 24) % 24;
  const estimatedRegion = estimateRegion(
    timeDifference, 
    hourlyData.map(h => h.count),
    dataset.length
  );

  const firstActivity = Math.min(...dataset.map(item => item.timestamp));
  const lastActivity = Math.max(...dataset.map(item => item.timestamp));

  const createChartData = (labels, values, label) => ({
    labels,
    datasets: [{ 
      label, 
      data: values, 
      backgroundColor: "#34A5E6", 
      borderRadius: 22 
    }],
  });

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTooltip && !event.target.closest('.relative.inline-block')) {
        setShowTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <strong>First activity:</strong> {new Date(firstActivity * 1000).toLocaleString()}
        </div>
        <div>
          <strong>Last activity:</strong> {new Date(lastActivity * 1000).toLocaleString()}
        </div>
        <div>
          <strong>Total activities:</strong> {dataset.length}
        </div>
      </div>
      <div className="relative inline-block">
        <strong>Estimated Region   <QuestionMarkCircleIcon
          className="w-5 h-5 inline-block align-middle cursor-pointer text-gray-500 hover:text-blue-500 mr-2 mb-1"
          onClick={() => setShowTooltip(!showTooltip)}
        /> :</strong><br /> {estimatedRegion}
        {showTooltip && (
          <div 
            className="absolute z-10 w-64 p-2 mt-2 text-sm text-gray-700 bg-base-100 border border-sky-300/30 rounded-lg shadow-lg tooltip"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            This estimation is based on activity patterns and requires at least 20 data points with clear active/inactive periods to make a reliable prediction.
          </div>
        )}
      </div>
      <div className="w-full h-80">
        <h3 className="text-lg font-semibold mb-4">Overall</h3>
        <Bar data={createChartData(getAllDates().map(d => d.date), getAllDates().map(d => d.count), "Activity count")} options={{ maintainAspectRatio: false }} />
      </div>
      <div className="min-h-20"></div>
      <div className="flex flex-col md:flex-row pb-10 gap-10">
        <div className="w-full h-80">
          <h3 className="text-lg font-semibold mb-2">By Day of the Week</h3>
          <Bar data={createChartData(groupByWeekDay().map(d => d.day), groupByWeekDay().map(d => d.count), "Activity count")} options={{ maintainAspectRatio: false }} />
        </div>
        <div className="w-full h-80">
          <h3 className="text-lg font-semibold mb-2">By Hour of the Day</h3>
          <Bar data={createChartData(hourlyData.map(d => d.hour), hourlyData.map(d => d.count), "Activity count")} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
};

export default ActivityCharts;