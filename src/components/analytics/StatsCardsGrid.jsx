import React from 'react';
import { 
  Zap, 
  DollarSign, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  Bot,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

function StatCard({ icon: Icon, label, value, subtitle, color, size = 'normal' }) {
  const colorStyles = {
    pink: { bg: 'bg-gradient-to-br from-pink-500 to-rose-600', light: 'bg-pink-50', text: 'text-pink-600' },
    green: { bg: 'bg-gradient-to-br from-emerald-500 to-green-600', light: 'bg-emerald-50', text: 'text-emerald-600' },
    blue: { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-600' },
    purple: { bg: 'bg-gradient-to-br from-purple-500 to-violet-600', light: 'bg-purple-50', text: 'text-purple-600' },
    amber: { bg: 'bg-gradient-to-br from-amber-500 to-orange-600', light: 'bg-amber-50', text: 'text-amber-600' },
    red: { bg: 'bg-gradient-to-br from-red-500 to-rose-600', light: 'bg-red-50', text: 'text-red-600' },
    indigo: { bg: 'bg-gradient-to-br from-indigo-500 to-blue-600', light: 'bg-indigo-50', text: 'text-indigo-600' },
    cyan: { bg: 'bg-gradient-to-br from-cyan-500 to-teal-600', light: 'bg-cyan-50', text: 'text-cyan-600' }
  };

  const styles = colorStyles[color] || colorStyles.pink;

  if (size === 'large') {
    return (
      <div className={`${styles.light} rounded-2xl p-5 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow`}>
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${styles.bg} opacity-20`} />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <div className={`${styles.bg} p-2 rounded-xl shadow-lg`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`${styles.bg} p-2.5 rounded-xl shadow-lg`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TopModelCard({ models }) {
  if (!models || models.length === 0) return null;
  
  const top3 = models.slice(0, 3);
  
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white col-span-2 row-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Modelos por Custo</p>
          <p className="text-lg font-bold mt-1">Ranking $$$</p>
        </div>
        <div className="bg-white/10 p-2 rounded-xl">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
      </div>
      
      <div className="space-y-3">
        {top3.map((model, idx) => (
          <div key={model.model} className="flex items-center gap-3">
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
              ${idx === 0 ? 'bg-amber-500 text-white' : 
                idx === 1 ? 'bg-slate-400 text-white' : 
                'bg-orange-400 text-white'}
            `}>
              {idx + 1}º
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{model.shortName}</p>
              <p className="text-[10px] text-slate-400">{model.calls} chamadas</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-400">${model.estimatedCost?.toFixed(4) || '0.0000'}</p>
              <p className="text-[10px] text-slate-400">{model.tokens?.toLocaleString()} tokens</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsCardsGrid({ stats, topModelsByCost }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {/* Row 1: Main stats */}
      <StatCard 
        icon={Zap} 
        label="Total Tokens" 
        value={stats.totalTokens.toLocaleString()} 
        color="pink"
        size="large"
      />
      <StatCard 
        icon={DollarSign} 
        label="Custo Estimado" 
        value={`$${stats.estimatedCost.toFixed(4)}`}
        subtitle={`Input: $${(stats.promptTokens * 0.000001).toFixed(4)}`}
        color="green"
        size="large"
      />
      
      {/* Top Models Card */}
      <TopModelCard models={topModelsByCost} />
      
      {/* Row 2: Secondary stats */}
      <StatCard icon={Activity} label="Chamadas" value={stats.totalCalls.toLocaleString()} color="blue" />
      <StatCard icon={CheckCircle} label="Sucesso" value={stats.successfulCalls.toLocaleString()} color="cyan" />
      <StatCard icon={AlertCircle} label="Erros" value={stats.failedCalls.toLocaleString()} color="red" />
      <StatCard icon={Clock} label="Tempo Médio" value={`${stats.avgDuration}ms`} color="amber" />
      <StatCard icon={Users} label="Usuários" value={stats.uniqueUsers.toString()} color="purple" />
      <StatCard icon={Bot} label="Reasoning" value={stats.reasoningTokens.toLocaleString()} color="indigo" />
    </div>
  );
}