"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = {
  labels: string[];
  data: number[];
};

export default function CustomerFlowChart({ labels, data }: Props) {
  const chartData = {
    labels,
    datasets: [
      {
        label: "Customers",
        data,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: {
        ticks: {
          stepSize: 20,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border h-64">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Flow</h3>
      <div className="h-44">
        <Bar data={chartData} options={options as any} />
      </div>
    </div>
  );
}
