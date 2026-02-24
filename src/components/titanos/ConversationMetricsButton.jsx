import React, { memo, useMemo } from 'react';
import { Bot, Hash, Coins, Clock, TrendingUp, BarChart2, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { calculateMetrics, formatTokens, formatCost, formatDuration } from './utils';

/**
 * Botão com métricas agregadas da conversa
 */
function ConversationMetricsButton({ messages = [], selectedModels = [] }) {
  const metrics = useMemo(() => calculateMetrics(messages), [messages]);

  if (messages.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 shadow-sm">
          <BarChart2 className="w-4 h-4" />
          <span className="text-xs font-medium hidden sm:inline-block">Métricas</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
          <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Métricas da Conversa
          </h4>
        </div>
        <div className="p-2">
          <div className="grid grid-cols-2 gap-2">
            <MetricCard icon={Bot} label="Modelos" value={selectedModels.length} />
            <MetricCard icon={TrendingUp} label="Respostas" value={metrics.responseCount} />
            <MetricCard icon={Hash} label="Tokens" value={formatTokens(metrics.totalTokens)} />
            <MetricCard icon={Coins} label="Custo Est." value={formatCost(metrics.totalCost)} />
            
            <div className="col-span-2 p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-wider">Tempo Médio</span>
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {formatDuration(metrics.avgDuration)}
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                <Info className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

const MetricCard = memo(({ icon: Icon, label, value }) => (
  <div className="p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
    <div className="flex items-center gap-2 text-slate-500 mb-1">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-lg font-bold text-slate-800">{value}</div>
  </div>
));
MetricCard.displayName = 'MetricCard';

export default memo(ConversationMetricsButton);