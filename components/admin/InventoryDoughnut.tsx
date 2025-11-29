"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type Item = { name: string; stock: number };

export default function InventoryDoughnut({ items }: { items: Item[] }) {
  const labels = items.map((i) => i.name);
  const dataArr = items.map((i) => i.stock);

  const data = {
    labels,
    datasets: [
      {
        data: dataArr,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Inventory Breakdown</h3>
      <div className="h-48">
        <Doughnut data={data as any} />
      </div>
    </div>
  );
}
