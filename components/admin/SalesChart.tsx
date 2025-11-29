"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Props = {
  labels: string[];
  data: number[];
};

export default function SalesChart({ labels, data }: Props) {
  const chartData = {
    labels,
    datasets: [
      {
        label: "Daily Revenue (₹)",
        data,
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        ticks: { maxRotation: 0 },
      },
      y: {
        ticks: {
          callback: function (value: number) {
            return `₹${value}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border h-64">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Daily Revenue</h3>
      <div className="h-44">
        <Line data={chartData} options={options as any} />
      </div>
    </div>
  );
}
