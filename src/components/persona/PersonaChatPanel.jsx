import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Sparkles } from "lucide-react";
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
 * Panel de chat para geração de personas
 */
export default function PersonaChatPanel({
  session,
  onUpdateSession,
  focusId,
  onNewSession
}) {
  const queryClient = useQueryClient();

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
    configEntity: ENTITIES.PERSONA_CONFIG,
    configQueryKey: QUERY_KEYS.CONFIGS.PERSONA,
    feature: FEATURES.PERSONA_CHAT,
    buildSystemPrompt: (cfg) => cfg?.prompt || ''
  });

  // Empty state
  if (!session) {
    return (
      <ChatEmptyState
        icon={User}
        title="Gerador de Personas"
        description="Selecione uma conversa do histórico ou inicie uma nova para criar sua persona através de uma entrevista guiada."
        buttonLabel="Nova Entrevista"
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
              <p>Vamos começar a entrevista para criar sua persona.</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <ChatMessage
              key={index}
              message={msg}
              showUsage={index === messages.length - 1 && msg.role === 'assistant'}
              focusId={focusId}
              onDataSaved={() => queryClient.invalidateQueries({ queryKey: ['personas'] })}
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
            placeholder="Responda às perguntas para construir sua persona..."
            enableFileUpload={true}
          />
        </div>
      </div>
    </div>
  );
}