"use client";

import React from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
};

export default function StatCard({ title, value, subtitle, icon, className = "" }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      {subtitle && <p className="mt-3 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}
