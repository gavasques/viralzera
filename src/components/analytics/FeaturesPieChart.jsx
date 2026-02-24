import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-3">
      <p className="font-semibold text-slate-900">{data.name}</p>
      <p className="text-sm text-slate-600">{data.tokens?.toLocaleString()} tokens</p>
      <p className="text-sm text-slate-600">{data.calls} chamadas</p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.05) return null;
  
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="#475569" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

export default function FeaturesPieChart({ data }) {
  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-2 rounded-lg">
            <Layers className="w-4 h-4 text-white" />
          </div>
          Tokens por Feature
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="tokens"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              label={renderCustomLabel}
              labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={entry.feature} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}