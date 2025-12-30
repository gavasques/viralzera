import React from 'react';
import { Bot, Hash, Coins, Clock, TrendingUp, BarChart2, Info } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function ConversationMetricsButton({ messages, selectedModels }) {
    // Calculate aggregated metrics
    const metrics = React.useMemo(() => {
        let totalTokens = 0;
        let totalCost = 0;
        let totalDuration = 0;
        let responseCount = 0;

        messages.forEach(msg => {
            if (msg.role === 'assistant' && msg.metrics) {
                const usage = msg.metrics.usage || {};
                totalTokens += (usage.total_tokens || usage.prompt_tokens + usage.completion_tokens || 0);
                totalDuration += (msg.metrics.duration || 0);
                responseCount++;
                
                // Estimate cost based on tokens (rough estimate)
                const promptTokens = usage.prompt_tokens || 0;
                const completionTokens = usage.completion_tokens || 0;
                totalCost += (promptTokens * 0.000001) + (completionTokens * 0.000002);
            }
        });

        const avgDuration = responseCount > 0 ? totalDuration / responseCount : 0;

        return { totalTokens, totalCost, totalDuration, avgDuration, responseCount };
    }, [messages]);

    const formatTokens = (tokens) => {
        if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
        if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
        return tokens.toString();
    };

    const formatCost = (cost) => {
        if (!cost || cost === 0) return '$0.00';
        if (cost < 0.01) return `$${cost.toFixed(4)}`;
        return `$${cost.toFixed(3)}`;
    };

    const formatDuration = (ms) => {
        if (!ms || ms === 0) return '0s';
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    if (!messages || messages.length === 0) return null;

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
                        <div className="p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Bot className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-medium uppercase tracking-wider">Modelos</span>
                            </div>
                            <div className="text-lg font-bold text-slate-800">
                                {selectedModels?.length || 0}
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-medium uppercase tracking-wider">Respostas</span>
                            </div>
                            <div className="text-lg font-bold text-slate-800">
                                {metrics.responseCount}
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Hash className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-medium uppercase tracking-wider">Tokens</span>
                            </div>
                            <div className="text-lg font-bold text-slate-800">
                                {formatTokens(metrics.totalTokens)}
                            </div>
                        </div>

                        <div className="p-3 rounded-lg border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Coins className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-medium uppercase tracking-wider">Custo Est.</span>
                            </div>
                            <div className="text-lg font-bold text-slate-800">
                                {formatCost(metrics.totalCost)}
                            </div>
                        </div>

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