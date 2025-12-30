import React, { useRef, useEffect, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageBubble from './MessageBubble';
import ChatColumnHeader from './ChatColumnHeader';
import { Loader2, Bot } from 'lucide-react';

export default function ChatColumn({ 
    modelId, 
    modelName, 
    messages, 
    isLoading,
    onHide,
    onRemove,
    onRegenerate,
    onExpand,
    isAdmin = false,
    conversationId
}) {
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    // Calculate metrics for this model
    const metrics = useMemo(() => {
        let totalTokens = 0;
        let totalCost = 0;
        let totalDuration = 0;
        let responseCount = 0;

        messages.forEach(msg => {
            if (msg.role === 'assistant' && msg.metrics) {
                const usage = msg.metrics.usage || {};
                totalTokens += (usage.total_tokens || (usage.prompt_tokens || 0) + (usage.completion_tokens || 0) || 0);
                totalDuration += (msg.metrics.duration || 0);
                responseCount++;
                
                // Estimate cost
                const promptTokens = usage.prompt_tokens || 0;
                const completionTokens = usage.completion_tokens || 0;
                totalCost += (promptTokens * 0.000001) + (completionTokens * 0.000002);
            }
        });

        const avgDuration = responseCount > 0 ? totalDuration / responseCount : 0;

        return { totalTokens, totalCost, avgDuration, responseCount };
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-slate-50 flex-1 min-w-[400px] relative group border-r border-slate-200/50 last:border-r-0">
            {/* Header with Metrics */}
            <ChatColumnHeader 
                modelId={modelId}
                modelName={modelName}
                isLoading={isLoading}
                metrics={metrics}
                onHide={onHide}
                onRemove={onRemove}
                onRegenerate={onRegenerate}
                onExpand={onExpand}
                hasMessages={messages.some(m => m.role === 'user')}
                isAdmin={isAdmin}
                conversationId={conversationId}
            />

            {/* Messages Area */}
            <ScrollArea className="flex-1">
                <div className="p-4 md:p-6 flex flex-col space-y-6 min-h-full pb-20">
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 opacity-60">
                            <div className="bg-slate-100 p-4 rounded-full mb-3">
                                <Bot className="w-6 h-6 opacity-50 text-slate-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-500">Aguardando início...</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <MessageBubble 
                                key={idx} 
                                role={msg.role} 
                                content={msg.content} 
                                metrics={msg.metrics}
                                modelName={msg.role === 'assistant' ? modelName : 'Você'}
                                chatTitle={modelName}
                                isInitialPrompt={msg.role === 'user' && idx === 0}
                            />
                        ))
                    )}
                    {isLoading && (
                        <div className="flex items-start gap-3 animate-in fade-in duration-300 px-1">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            </div>
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </ScrollArea>
        </div>
    );
}