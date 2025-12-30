import React, { useRef, useEffect, useMemo, memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageBubble from './MessageBubble';
import ChatColumnHeader from './ChatColumnHeader';
import { Loader2, Bot } from 'lucide-react';
import { calculateMetrics } from './utils';

/**
 * Coluna de chat para um modelo específico
 */
function ChatColumn({ 
  modelId, 
  modelName, 
  messages, 
  isLoading,
  onHide,
  onRemove,
  onRegenerate,
  onExpand,
  isAdmin = false,
  conversationId,
  promptLog,
  onShowLog
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll suave
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  // Calcula métricas
  const metrics = useMemo(() => calculateMetrics(messages), [messages]);

  const hasUserMessages = messages.some(m => m.role === 'user');

  return (
    <div className="flex flex-col h-full bg-slate-50 flex-1 min-w-[400px] relative group border-r border-slate-200/50 last:border-r-0">
      <ChatColumnHeader 
        modelId={modelId}
        modelName={modelName}
        isLoading={isLoading}
        metrics={metrics}
        onHide={onHide}
        onRemove={onRemove}
        onRegenerate={onRegenerate}
        onExpand={onExpand}
        hasMessages={hasUserMessages}
        isAdmin={isAdmin}
        conversationId={conversationId}
      />

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 flex flex-col space-y-6 min-h-full pb-20">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble 
                key={msg.id || idx} 
                role={msg.role} 
                content={msg.content} 
                metrics={msg.metrics}
                modelName={msg.role === 'assistant' ? modelName : 'Você'}
                chatTitle={modelName}
                isInitialPrompt={msg.role === 'user' && idx === 0}
                promptLog={promptLog}
                isAdmin={isAdmin}
                onShowLog={onShowLog}
              />
            ))
          )}
          
          {isLoading && <LoadingIndicator />}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>
    </div>
  );
}

const EmptyState = memo(() => (
  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 opacity-60">
    <div className="bg-slate-100 p-4 rounded-full mb-3">
      <Bot className="w-6 h-6 opacity-50 text-slate-500" />
    </div>
    <p className="text-sm font-medium text-slate-500">Aguardando início...</p>
  </div>
));
EmptyState.displayName = 'EmptyState';

const LoadingIndicator = memo(() => (
  <div className="flex items-start gap-3 animate-in fade-in duration-300 px-1">
    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
    </div>
    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
      <div className="flex gap-1.5">
        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
));
LoadingIndicator.displayName = 'LoadingIndicator';

export default memo(ChatColumn);