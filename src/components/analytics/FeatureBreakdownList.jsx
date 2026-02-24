import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Layers } from "lucide-react";

const COLORS = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

export default function FeatureBreakdownList({ data }) {
  const maxTokens = data[0]?.tokens || 1;
  const totalTokens = data.reduce((sum, f) => sum + f.tokens, 0);

  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-2 rounded-lg">
            <Layers className="w-4 h-4 text-white" />
          </div>
          Consumo por Feature
        </CardTitle>
        <CardDescription>Detalhamento por funcionalidade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((feature, idx) => {
            const percentage = ((feature.tokens / totalTokens) * 100).toFixed(1);
            const color = COLORS[idx % COLORS.length];
            
            return (
              <div key={feature.feature} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-slate-700 text-sm">{feature.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">{feature.calls} chamadas</span>
                    <span className="font-bold text-slate-900 text-sm min-w-[80px] text-right">
                      {feature.tokens.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-slate-500 min-w-[50px] text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${(feature.tokens / maxTokens) * 100}%`,
                      backgroundColor: color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}