import React, { useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid'; // Import l'icône


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const estimateRegion = (timeDifference) => {
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

  const firstActivity = Math.min(...dataset.map(item => item.timestamp));
  const lastActivity = Math.max(...dataset.map(item => item.timestamp));

  const createChartData = (labels, values, label) => ({
    labels,
    datasets: [{ 
      label, 
      data: values, 
      backgroundColor: "#34A5E6", 
      borderRadius: 22 // Ajout des bords arrondis pour toutes les barres du graphique
    }],
  });

  

  const sleepStartUTC = groupByHour().reduce((min, curr, idx) => curr.count < min.count ? { count: curr.count, hour: idx } : min, { count: Infinity, hour: 0 }).hour;
  const timeDifference = (sleepStartUTC - 0 + 24) % 24;
  const estimatedRegion = estimateRegion(timeDifference);

  // State for tooltip visibility
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <strong>First activity:</strong> {new Date(firstActivity * 1000).toLocaleString()}
        </div>
        <div>
          <strong>Last activity:</strong> {new Date(lastActivity * 1000).toLocaleString()}
        </div>
      </div>
      <div className="relative inline-block">

        <strong>Estimated Region   <QuestionMarkCircleIcon
          className="w-5 h-5 inline-block align-middle cursor-pointer text-gray-500 hover:text-blue-500 mr-2 mb-1"
          onClick={() => setShowTooltip(!showTooltip)}
        /> :</strong> {estimatedRegion}
        {showTooltip && (
          <div 
            className="absolute z-10 w-64 p-2 mt-2 text-sm text-gray-700 bg-base-100 border border-sky-300/30 rounded-lg shadow-lg tooltip"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            This feature is under development. We are trying to determine when a person sleeps to estimate where they live.
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
          <Bar data={createChartData(groupByHour().map(d => d.hour), groupByHour().map(d => d.count), "Activity count")} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
};

export default ActivityCharts;