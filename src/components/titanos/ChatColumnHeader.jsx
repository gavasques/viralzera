import React from 'react';
import { Bot, EyeOff, Trash2, Clock, Hash, Coins, RefreshCw, Maximize2, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import VoteButton from './VoteButton';

export default function ChatColumnHeader({ 
    modelId, 
    modelName, 
    isLoading,
    metrics,
    onHide,
    onRemove,
    onRegenerate,
    onExpand,
    hasMessages,
    isAdmin = false,
    conversationId
}) {
    const totalTokens = metrics?.totalTokens || 0;
    const totalCost = metrics?.totalCost || 0;
    const avgDuration = metrics?.avgDuration || 0;

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
        <div className="px-4 py-3 border-b border-slate-100 bg-white/90 backdrop-blur-sm sticky top-0 z-[5] group/header transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="p-1.5 bg-indigo-100/50 rounded-md shrink-0 border border-indigo-100">
                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-slate-800 truncate tracking-tight" title={modelName || modelId}>
                            {modelName || modelId}
                        </span>
                        {isAdmin && (
                            <span className="text-[10px] text-slate-400 font-medium truncate opacity-80">{modelId}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {isLoading && (
                        <Badge variant="secondary" className="animate-pulse text-[9px] bg-indigo-50 text-indigo-600 px-1.5 h-5 mr-1 border-0">
                            Gerando
                        </Badge>
                    )}

                    <div className="flex items-center gap-0.5">
                    
                    {hasMessages && conversationId && (
                        <VoteButton 
                            conversationId={conversationId}
                            modelId={modelId}
                            modelAlias={modelName || modelId}
                            context="multi_chat"
                            compact
                        />
                    )}

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            >
                                <Info className="w-3.5 h-3.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0" align="end">
                            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                    <Bot className="w-3.5 h-3.5 text-indigo-500" />
                                    Métricas do Modelo
                                </h4>
                            </div>
                            <div className="p-2 space-y-1">
                                <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <Hash className="w-3.5 h-3.5" />
                                        <span>Tokens</span>
                                    </div>
                                    <span className="font-medium text-slate-900 text-xs">{formatTokens(totalTokens)}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <Coins className="w-3.5 h-3.5" />
                                        <span>Custo Est.</span>
                                    </div>
                                    <span className="font-medium text-slate-900 text-xs">{formatCost(totalCost)}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Duração Média</span>
                                    </div>
                                    <span className="font-medium text-slate-900 text-xs">{formatDuration(avgDuration)}</span>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    onClick={onExpand}
                                >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p className="text-xs">Expandir conversa</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {hasMessages && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 text-slate-400 hover:text-green-600 hover:bg-green-50"
                                        onClick={onRegenerate}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p className="text-xs">Regenerar resposta</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                    onClick={onHide}
                                >
                                    <EyeOff className="w-3.5 h-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p className="text-xs">Ocultar coluna</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={onRemove}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p className="text-xs">Remover modelo</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    </div>
                </div>
            </div>


        </div>
    );
}