import React, { useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ChatMessage, 
  ChatInput, 
  ChatLoadingIndicator, 
  ChatEmptyState 
} from '@/components/chat';
import { useChatPanel } from '@/components/hooks/useChatPanel';
import { QUERY_KEYS, FEATURES, ENTITIES } from '@/components/constants/queryKeys';

/**
 * Panel de chat para análise de produtos
 */
export default function ProductChatPanel({
  session,
  onUpdateSession,
  focusId,
  onNewSession,
  personas = []
}) {
  const queryClient = useQueryClient();

  // Build system prompt with persona placeholder
  const buildSystemPrompt = useCallback((config) => {
    let prompt = config?.prompt || '';
    
    const persona = personas.find(p => p.id === session?.persona_id);
    if (persona) {
      prompt = prompt.replace('{{PERSONA_DATA}}', JSON.stringify(persona, null, 2));
    }
    
    if (session?.other_products_context) {
      prompt += '\n\n' + session.other_products_context;
    }
    
    return prompt;
  }, [personas, session]);

  const {
    isLoading,
    isReasoning,
    isSearching,
    scrollRef,
    config,
    messages,
    handleSend
  } = useChatPanel({
    session,
    onUpdateSession,
    focusId,
    configEntity: ENTITIES.PRODUCT_CONFIG,
    configQueryKey: QUERY_KEYS.CONFIGS.PRODUCT,
    feature: FEATURES.PRODUCT_CHAT,
    buildSystemPrompt
  });

  // Empty state
  if (!session) {
    return (
      <ChatEmptyState
        icon={Package}
        title="Analisador de Produtos"
        description="Selecione uma conversa do histórico ou inicie uma nova para analisar e otimizar seu produto."
        buttonLabel="Nova Análise"
        onAction={onNewSession}
      />
    );
  }



  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-indigo-400" />
              <p>Vamos analisar seu produto. Descreva o que você oferece.</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              message={msg}
              showUsage={index === messages.length - 1 && msg.role === 'assistant'}
              focusId={focusId}
              onDataSaved={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
            />
          ))}
          
          {isLoading && (
            <ChatLoadingIndicator 
              model={config?.model_name}
              isReasoning={isReasoning}
              isSearching={isSearching}
            />
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
            placeholder="Descreva seu produto ou responda às perguntas..."
            enableFileUpload={true}
          />
        </div>
      </div>
    </div>
  );
}