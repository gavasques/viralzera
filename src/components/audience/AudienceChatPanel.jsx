import React, { useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Sparkles } from "lucide-react";
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
 * Panel de chat para geração de público-alvo
 */
export default function AudienceChatPanel({
  session,
  onUpdateSession,
  focusId,
  personas = [],
  onNewSession
}) {
  const queryClient = useQueryClient();

  // Build system prompt with persona/product placeholders
  const buildSystemPrompt = useCallback((config) => {
    let prompt = config?.prompt || '';
    
    const persona = personas.find(p => p.id === session?.persona_id);
    if (persona) {
      prompt = prompt.replace('{{PERSONA_DATA}}', JSON.stringify(persona, null, 2));
    } else {
      prompt = prompt.replace('{{PERSONA_DATA}}', 'Nenhuma persona selecionada.');
    }
    
    if (session?.product_ids?.length > 0) {
      prompt = prompt.replace('{{PRODUCTS_DATA}}', 'Produtos selecionados para referência.');
    } else {
      prompt = prompt.replace('{{PRODUCTS_DATA}}', 'Nenhum produto selecionado.');
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
    configEntity: ENTITIES.AUDIENCE_CONFIG,
    configQueryKey: QUERY_KEYS.CONFIGS.AUDIENCE,
    feature: FEATURES.AUDIENCE_CHAT,
    buildSystemPrompt
  });

  // Empty state
  if (!session) {
    return (
      <ChatEmptyState
        icon={Users}
        title="Gerador de Público-Alvo"
        description="Selecione uma conversa do histórico ou inicie uma nova para gerar públicos-alvo detalhados com ajuda da IA."
        buttonLabel="Novo Público"
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
              <p>Envie uma mensagem para começar a criar seu público-alvo.</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              message={msg}
              showUsage={index === messages.length - 1 && msg.role === 'assistant'}
              focusId={focusId}
              onDataSaved={() => queryClient.invalidateQueries({ queryKey: ['audiences'] })}
            />
          ))}
          
          {isLoading && (
            <ChatLoadingIndicator 
              isReasoning={isReasoning}
              isSearching={isSearching}
              model={config?.model_name}
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
            placeholder="Descreva seu produto ou serviço para gerar públicos-alvo..."
            enableFileUpload={true}
          />
        </div>
      </div>
    </div>
  );
}