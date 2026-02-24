import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, TrendingUp } from "lucide-react";

export default function UserConsumptionList({ data }) {
  const maxTokens = data[0]?.tokens || 1;

  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2 rounded-lg">
            <Users className="w-4 h-4 text-white" />
          </div>
          Consumo por Usuário
        </CardTitle>
        <CardDescription>Ranking detalhado de consumo e custos</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {data.map((user, idx) => (
              <div 
                key={user.email} 
                className="relative bg-gradient-to-r from-slate-50 to-white rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-all hover:shadow-sm"
              >
                {/* Position badge */}
                <div className={`
                  absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg
                  ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 
                    idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                    idx === 2 ? 'bg-gradient-to-br from-orange-300 to-amber-400 text-white' :
                    'bg-slate-200 text-slate-600'}
                `}>
                  {idx + 1}
                </div>

                <div className="pl-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{user.email}</p>
                      <p className="text-xs text-slate-500">{user.featuresCount} features • {user.calls} chamadas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">${user.estimatedCost.toFixed(4)}</p>
                      <p className="text-[10px] text-slate-400">custo estimado</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all"
                      style={{ width: `${(user.tokens / maxTokens) * 100}%` }}
                    />
                  </div>

                  {/* Token breakdown */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
                      <p className="text-sm font-bold text-slate-900">{user.tokens.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400 uppercase">Total</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-blue-600">{user.promptTokens.toLocaleString()}</p>
                      <p className="text-[9px] text-blue-400 uppercase">Input</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-purple-600">{user.completionTokens.toLocaleString()}</p>
                      <p className="text-[9px] text-purple-400 uppercase">Output</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-indigo-600">{user.reasoningTokens.toLocaleString()}</p>
                      <p className="text-[9px] text-indigo-400 uppercase">Reasoning</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}