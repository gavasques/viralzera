import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const COLORS = ['#ec4899', '#f472b6', '#f9a8d4', '#fce7f3', '#fdf2f8'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.[0]) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-3">
      <p className="font-semibold text-slate-900 text-sm">{data.model}</p>
      <p className="text-sm text-slate-600">{data.tokens?.toLocaleString()} tokens</p>
      <p className="text-sm text-slate-600">{data.calls} chamadas</p>
    </div>
  );
};

export default function TopModelsChart({ data }) {
  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2 rounded-lg">
            <Bot className="w-4 h-4 text-white" />
          </div>
          Top 10 Modelos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              stroke="#94a3b8" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
            />
            <YAxis 
              type="category" 
              dataKey="shortName" 
              stroke="#94a3b8" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar 
              dataKey="tokens" 
              radius={[0, 6, 6, 0]}
              maxBarSize={24}
            >
              {data.map((entry, index) => (
                <Cell key={entry.model} fill={COLORS[Math.min(index, COLORS.length - 1)]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}