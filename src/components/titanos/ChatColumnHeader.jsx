import React, { memo } from 'react';
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
import { formatTokens, formatCost, formatDuration } from './utils';

/**
 * Header da coluna de chat com métricas e ações
 */
function ChatColumnHeader({ 
  modelId, 
  modelName, 
  isLoading,
  metrics = {},
  onHide,
  onRemove,
  onRegenerate,
  onExpand,
  hasMessages,
  isAdmin = false,
  conversationId
}) {
  const { totalTokens = 0, totalCost = 0, avgDuration = 0 } = metrics;

  return (
    <div className="px-4 py-3 border-b border-slate-100 bg-white/90 backdrop-blur-sm sticky top-0 z-[5] transition-all">
      <div className="flex items-center justify-between gap-2">
        {/* Model Info */}
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

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {isLoading && (
            <Badge variant="secondary" className="animate-pulse text-[9px] bg-indigo-50 text-indigo-600 px-1.5 h-5 mr-1 border-0">
              Gerando
            </Badge>
          )}

          {hasMessages && conversationId && (
            <VoteButton 
              conversationId={conversationId}
              modelId={modelId}
              modelAlias={modelName || modelId}
              context="multi_chat"
              compact
            />
          )}

          <MetricsPopover 
            totalTokens={totalTokens} 
            totalCost={totalCost} 
            avgDuration={avgDuration} 
          />

          <ActionButton icon={Maximize2} tooltip="Expandir conversa" onClick={onExpand} />

          {hasMessages && (
            <ActionButton 
              icon={RefreshCw} 
              tooltip="Regenerar resposta" 
              onClick={onRegenerate}
              disabled={isLoading}
              className={isLoading ? 'animate-spin' : ''}
              hoverColor="green"
            />
          )}
          
          <ActionButton icon={EyeOff} tooltip="Ocultar coluna" onClick={onHide} hoverColor="amber" />
          <ActionButton icon={Trash2} tooltip="Remover modelo" onClick={onRemove} hoverColor="red" />
        </div>
      </div>
    </div>
  );
}

const ActionButton = memo(({ icon: Icon, tooltip, onClick, disabled, className = '', hoverColor = 'indigo' }) => {
  const colorClasses = {
    indigo: 'hover:text-indigo-600 hover:bg-indigo-50',
    green: 'hover:text-green-600 hover:bg-green-50',
    amber: 'hover:text-amber-600 hover:bg-amber-50',
    red: 'hover:text-red-600 hover:bg-red-50',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-7 w-7 text-slate-400 ${colorClasses[hoverColor]} ${className}`}
            onClick={onClick}
            disabled={disabled}
          >
            <Icon className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
ActionButton.displayName = 'ActionButton';

const MetricsPopover = memo(({ totalTokens, totalCost, avgDuration }) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
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
        <MetricRow icon={Hash} label="Tokens" value={formatTokens(totalTokens)} />
        <MetricRow icon={Coins} label="Custo Est." value={formatCost(totalCost)} />
        <MetricRow icon={Clock} label="Duração Média" value={formatDuration(avgDuration)} />
      </div>
    </PopoverContent>
  </Popover>
));
MetricsPopover.displayName = 'MetricsPopover';

const MetricRow = memo(({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
    <div className="flex items-center gap-2 text-slate-500 text-xs">
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </div>
    <span className="font-medium text-slate-900 text-xs">{value}</span>
  </div>
));
MetricRow.displayName = 'MetricRow';

export default memo(ChatColumnHeader);