import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Register Chart.js components (do this once at the top)
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const BarChart = ({ instructorCount, studentCount }) => {
  // Chart data
  const userData = {
    labels: ["Instructors", "Students"],
    datasets: [
      {
        label: "User Distribution",
        data: [instructorCount, studentCount],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // Blue for instructors
          "rgba(16, 185, 129, 0.8)", // Green for students
        ],
        borderColor: ["rgba(59, 130, 246, 1)", "rgba(16, 185, 129, 1)"],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = instructorCount + studentCount;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        User Distribution
      </h2>
      <div className="h-64">
        <Doughnut data={userData} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">Instructors</p>
          <p className="text-2xl font-bold text-blue-600">{instructorCount}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">Students</p>
          <p className="text-2xl font-bold text-green-600">{studentCount}</p>
        </div>
      </div>
    </div>
  );
};

export default BarChart;
