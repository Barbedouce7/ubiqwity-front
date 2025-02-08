import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { API_CONFIG } from '../utils/apiConfig';


// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ActivityCharts = ({stakekey}) => {
  //const { stakekey } = useParams();
  const [detailsData, setDetailsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const detailsResponse = await axios.get(`${API_CONFIG.baseUrl}wallet/${stakekey}/details`);
        setDetailsData(detailsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="animate-spin rounded-full mx-auto h-6 w-6 border-b-2 border-sky-500 mt-40"></div>
      </div>
    );
  }

  if (!detailsData) {
    return <p>No data available.</p>;
  }

  const activity = detailsData.activity;
  console.log(activity)
  // Data for daily activity
  const dailyData = {
    labels: activity.activityPerDay.labels,
    datasets: [
      {
        label: "Activity by Day",
        data: activity.activityPerDay.data,
        borderColor: "rgba(52, 165, 230, 1)",
        backgroundColor: "rgba(52, 165, 230, 0.9)",
        borderWidth: 1,
        borderRadius: 10,
        barPercentage: 1,
        categoryPercentage: 1,
      },
    ],
  };

  // Data for hourly activity
  const hourlyData = {
    labels: activity.activityPerHour.labels.map((h) => `${h}h`),
    datasets: [
      {
        label: "Activity by Hour",
        data: activity.activityPerHour.data,
        borderColor: "rgba(52, 165, 230, 1)",
        backgroundColor: "rgba(52, 165, 230, 0.9)",
        borderWidth: 2,
        borderRadius: 10,
      },
    ],
  };

  // Adjusting for the day of week chart based on the provided JSON data
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weekDayCount = Array(7).fill(0);

  // Count activities for each day of the week
  activity.activityPerDay.labels.forEach((date, index) => {
    const dayIndex = new Date(date).getDay();
    weekDayCount[dayIndex] += activity.activityPerDay.data[index];
  });

  const weeklyData = {
    labels: weekDays,
    datasets: [
      {
        label: "Activity by Day of the Week",
        data: weekDayCount,
        borderColor: "rgba(52, 165, 230, 1)",
        backgroundColor: "rgba(52, 165, 230, 0.9)",
        borderWidth: 2,
        borderRadius: 10,
      },
    ],
  };

  // Options for charts
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="p-4 space-y-6">
       <div className="mb-2">
          <strong>Estimated region:</strong> {activity.estimatedRegion || 'Unknown'}
        </div>

      

      <div className="flex flex-col md:flex-row pb-10 gap-10">
        <div className="w-full h-80 rounded-lg pb-2">
          <h3 className="text-lg font-semibold mb-2">By Day of the Week</h3>
          <Bar data={weeklyData} options={options} />
        </div>

        <div className="w-full h-80 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">By Hour of the Day</h3>
          <Bar data={hourlyData} options={options} />
        </div>
      </div>

      <div className="w-full h-80 rounded-lg mt-6 mt-10">
        <h3 className="text-lg font-semibold mb-1">Overall</h3>
        <Bar data={dailyData} options={options} />
      </div>
      
    </div>
  );
};

export default ActivityCharts;