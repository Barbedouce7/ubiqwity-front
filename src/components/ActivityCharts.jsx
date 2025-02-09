import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { API_CONFIG } from '../utils/apiConfig';


// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const ActivityCharts = ({ stakekey, detailsData }) => {
  if (!detailsData) {
    return <p>No data available.</p>;
  }

  const activity = detailsData.activity;

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

  // Calcul des activités par jour de la semaine
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weekDayCount = Array(7).fill(0);
  
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

  return (
    <div className="p-4 space-y-6">
      <div className="mb-2">
        <strong>Estimated region:</strong> {activity.estimatedRegion || 'Unknown'}
      </div>

      <div className="flex flex-col md:flex-row pb-10 gap-10">
        <div className="w-full h-80 rounded-lg pb-2">
          <h3 className="text-lg font-semibold mb-2">By Day of the Week</h3>
          <Bar data={weeklyData} />
        </div>

        <div className="w-full h-80 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">By Hour of the Day</h3>
          <Bar data={hourlyData} />
        </div>
      </div>

      <div className="w-full h-80 rounded-lg mt-6 mt-10">
        <h3 className="text-lg font-semibold mb-1">Overall</h3>
        <Bar data={dailyData} />
      </div>
    </div>
  );
};

export default ActivityCharts;