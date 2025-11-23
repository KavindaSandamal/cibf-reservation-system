import React from 'react';
import { CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react';

const StallStatistics = ({ statistics }) => {
  if (!statistics) return null;

  const statCards = [
    {
      label: 'Available Stalls',
      value: statistics.availableStalls,
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-600',
      textColor: 'text-green-100'
    },
    {
      label: 'Reserved Stalls',
      value: statistics.reservedStalls,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-100'
    },
    {
      label: 'Unavailable Stalls',
      value: statistics.unavailableStalls,
      icon: XCircle,
      gradient: 'from-red-500 to-rose-600',
      textColor: 'text-red-100'
    },
    {
      label: 'Total Stalls',
      value: statistics.totalStalls,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-indigo-600',
      textColor: 'text-blue-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index}
            className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 text-white shadow-xl hover:scale-105 transition-transform duration-300`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon size={32} />
              <span className="text-3xl font-bold">{stat.value}</span>
            </div>
            <p className={`${stat.textColor} font-medium`}>{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
};
export default StallStatistics;