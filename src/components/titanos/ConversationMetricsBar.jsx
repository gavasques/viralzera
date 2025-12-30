import React from 'react';
import { Bot, Hash, Coins, Clock, TrendingUp } from 'lucide-react';

export default function ConversationMetricsBar({ messages, selectedModels }) {
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
                // This is a simplified calculation - real costs vary by model
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

    return (
        <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-100/80 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-6 text-[11px] font-medium tracking-wide">
                <div className="flex items-center gap-1.5 text-slate-600">
                    <Bot className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-bold text-slate-800">{selectedModels?.length || 0}</span>
                    <span className="text-slate-400">modelos</span>
                </div>
                
                <div className="h-3 w-px bg-slate-200"></div>

                <div className="flex items-center gap-1.5 text-slate-600">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    <span className="font-bold text-slate-800">{metrics.responseCount}</span>
                    <span className="text-slate-400">respostas</span>
                </div>

                <div className="h-3 w-px bg-slate-200"></div>

                <div className="flex items-center gap-1.5 text-slate-600">
                    <Hash className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-bold text-slate-800">{formatTokens(metrics.totalTokens)}</span>
                    <span className="text-slate-400">tokens</span>
                </div>

                <div className="h-3 w-px bg-slate-200"></div>

                <div className="flex items-center gap-1.5 text-slate-600">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-slate-800">{formatCost(metrics.totalCost)}</span>
                    <span className="text-slate-400">custo</span>
                </div>

                <div className="h-3 w-px bg-slate-200"></div>

                <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    <span className="font-bold text-slate-800">{formatDuration(metrics.avgDuration)}</span>
                    <span className="text-slate-400">média</span>
                </div>
            </div>
        </div>
    );
}