import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  ChatMessage, 
  ChatInput, 
  ChatLoadingIndicator, 
  ChatEmptyState,
  sendMessage 
} from '@/components/chat';

/**
 * Panel de chat para geração de scripts
 */
export default function ScriptChatPanel({
  session,
  onUpdateSession,
  onSendToCanvas,
  isGenerating: isExternalGenerating = false
}) {
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const isBusy = isLoading || isExternalGenerating;

  // Fetch script config (global - único para todos os usuários)
  const { data: scriptConfig } = useQuery({
    queryKey: ['scriptConfig', 'global'],
    queryFn: async () => {
      const configs = await base44.entities.ScriptConfig.list('-created_date', 1);
      return configs[0];
    },
    staleTime: 60000
  });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages?.length, isLoading, isExternalGenerating]);

  const handleSend = async (message, files = []) => {
    if (!session) return;

    // Use session model if defined, otherwise fallback to config
    const model = session.model || scriptConfig?.model || 'openai/gpt-4o-mini';
    const systemPrompt = scriptConfig?.prompt || '';

    // Adiciona mensagem do usuário
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      files: files.length > 0 ? files.map(f => ({ name: f.name, url: f.url })) : undefined
    };

    const updatedMessages = [...(session.messages || []), userMessage];
    onUpdateSession({ ...session, messages: updatedMessages });

    setIsLoading(true);

    try {
      const apiMessages = [];
      
      if (systemPrompt) {
        apiMessages.push({ role: 'system', content: systemPrompt });
      }
      
      updatedMessages.forEach(msg => {
        apiMessages.push({ role: msg.role, content: msg.content });
      });

      const response = await sendMessage({
        model,
        messages: apiMessages,
        options: {
          files,
          maxTokens: 4000,
          enableReasoning: session.enable_reasoning,
          reasoningEffort: session.reasoning_effort,
          enableWebSearch: session.enable_web_search,
          feature: 'script_chat',
          modelName: session?.model_name || scriptConfig?.model_name || model,
          sessionId: session?.id,
          focusId: session?.focus_id
        }
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        usage: response.usage
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const totalTokens = (session.total_tokens || 0) + (response.usage?.totalTokens || 0);
      
      onUpdateSession({ 
        ...session, 
        messages: finalMessages,
        total_tokens: totalTokens
      });

    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToCanvas = (content) => {
    if (onSendToCanvas) {
      onSendToCanvas(content, session?.title);
    }
  };

  // Empty state
  if (!session) {
    return (
      <ChatEmptyState
        icon={FileText}
        title="Gerador de Scripts"
        description="Selecione uma conversa do histórico ou inicie uma nova para criar scripts magnéticos."
        buttonLabel="Novo Script"
      />
    );
  }

  const messages = session.messages || [];

  return (
    <div className="flex flex-col h-full flex-1 bg-slate-50/30 overflow-hidden">
      {/* Session Info Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between shadow-sm shrink-0 z-10">
        <h3 className="font-semibold text-sm text-slate-800 truncate">{session.title}</h3>
        <div className="flex items-center gap-2">
           {session.model_name && (
             <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[10px] font-medium text-slate-600">{session.model_name}</span>
             </div>
           )}
           {session.enable_reasoning && (
             <div className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100" title={`Deep Think: ${session.reasoning_effort}`}>
                <span className="text-[10px] font-medium text-indigo-600">Deep Think</span>
             </div>
           )}
           {session.enable_web_search && (
             <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100" title="Web Search Ativo">
                <span className="text-[10px] font-medium text-emerald-600">Web</span>
             </div>
           )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
              <p>Envie uma mensagem para começar a criar seu script.</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              message={msg}
              showUsage={index === messages.length - 1 && msg.role === 'assistant'}
              onSendToCanvas={msg.role === 'assistant' ? () => handleSendToCanvas(msg.content) : undefined}
            />
          ))}
          
          {isBusy && (
            <ChatLoadingIndicator 
              model={session?.model_name || scriptConfig?.model_name}
              isReasoning={session?.enable_reasoning}
              isSearching={session?.enable_web_search}
            />
          )}
          </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-slate-200 bg-white p-4 shadow-sm">
          <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSend}
            isLoading={isBusy}
            placeholder="Descreva o script que você quer criar..."
            enableFileUpload={true}
          />
        </div>
      </div>
    </div>
  );
}