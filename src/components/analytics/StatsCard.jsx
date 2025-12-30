import React from 'react';

export default function StatsCard({ icon: Icon, label, value, subtitle, color = 'pink' }) {
  const colorClasses = {
    pink: 'from-pink-500 to-rose-600',
    green: 'from-emerald-500 to-green-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-violet-600',
    amber: 'from-amber-500 to-orange-600',
    red: 'from-red-500 to-rose-600',
    indigo: 'from-indigo-500 to-blue-600',
    cyan: 'from-cyan-500 to-teal-600'
  };

  const bgClasses = {
    pink: 'bg-pink-50',
    green: 'bg-emerald-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    amber: 'bg-amber-50',
    red: 'bg-red-50',
    indigo: 'bg-indigo-50',
    cyan: 'bg-cyan-50'
  };

  return (
    <div className={`relative ${bgClasses[color]} rounded-2xl p-4 border border-slate-100/50 hover:shadow-sm transition-all overflow-hidden`}>
      <div className="flex items-center gap-3">
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-2 rounded-xl shadow-lg shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{label}</p>
          <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
          {subtitle && <p className="text-[10px] text-slate-500 truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}