/**
 * Hooks para envio de mensagens no Multi Chat
 * Responsabilidade: orquestrar envio de mensagens para múltiplos modelos
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { 
  getUserApiKey, 
  callOpenRouter, 
  validateApiKey 
} from '../services/openRouterService';
import { 
  saveUserMessage, 
  saveAssistantMessage, 
  prepareMessageHistory,
  injectGroupSystemPrompt,
  prepareRegenerateHistory,
  prepareSingleModelHistory,
} from '../services/messageService';
import { TITANOS_QUERY_KEYS } from '../constants';

/**
 * Hook principal para envio de mensagens a múltiplos modelos
 */
export function useSendMessage(conversationId, activeConversation, messages, groups) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (input, selectedModels) => {
    // Validação de entrada
    if (!input?.trim()) {
      toast.error('Digite uma mensagem');
      return { success: false };
    }
    if (!conversationId) {
      toast.error('Selecione uma conversa');
      return { success: false };
    }
    if (!selectedModels?.length) {
      toast.error('Selecione pelo menos um modelo');
      return { success: false };
    }

    setIsLoading(true);

    try {
      // Valida API key
      const { isValid, apiKey } = await validateApiKey();
      if (!isValid) {
        toast.error('Configure sua API Key do OpenRouter em Configurações');
        return { success: false };
      }

      // Prepara histórico
      let history = prepareMessageHistory(messages, selectedModels, input);
      history = injectGroupSystemPrompt(history, messages, activeConversation, groups);

      // Salva mensagem do usuário primeiro
      await saveUserMessage(conversationId, input.trim());

      // Prepara opções
      const options = {
        enableReasoning: activeConversation?.enable_reasoning || false,
        reasoningEffort: activeConversation?.reasoning_effort || 'high',
        enableWebSearch: activeConversation?.enable_web_search || false,
      };

      // Chama cada modelo em paralelo
      const results = await Promise.allSettled(
        selectedModels.map(async (modelId) => {
          try {
            const result = await callOpenRouter(apiKey, modelId, history, options);
            
            // Salva resposta
            await saveAssistantMessage(conversationId, modelId, result.content, {
              prompt_tokens: result.usage?.prompt_tokens || 0,
              completion_tokens: result.usage?.completion_tokens || 0,
              total_tokens: result.usage?.total_tokens || 0,
              duration_ms: result.duration,
              cost: result.usage?.cost || 0,
            });
            
            return { modelId, success: true };
          } catch (err) {
            console.error(`[useSendMessage] Error for ${modelId}:`, err.message);
            return { modelId, success: false, error: err.message };
          }
        })
      );

      // Analisa resultados
      const failures = results.filter(r => r.status === 'rejected' || !r.value?.success);
      
      if (failures.length === selectedModels.length) {
        toast.error('Falha em todos os modelos');
        return { success: false };
      }
      
      if (failures.length > 0) {
        const failedModels = failures
          .map(f => f.value?.modelId || 'Unknown')
          .join(', ');
        toast.warning(`${failures.length} modelo(s) falharam: ${failedModels}`);
      }

      // Invalida queries
      await invalidateConversationQueries(queryClient, conversationId);

      return { success: true };
    } catch (err) {
      console.error('[useSendMessage] Error:', err);
      toast.error('Falha ao enviar mensagem: ' + (err.message || 'Erro desconhecido'));
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, activeConversation, messages, groups, queryClient]);

  return { sendMessage, isLoading };
}

/**
 * Hook para regenerar resposta de um modelo específico
 */
export function useRegenerateResponse(conversationId) {
  const queryClient = useQueryClient();
  const [regeneratingModel, setRegeneratingModel] = useState(null);

  const regenerate = useCallback(async (modelId, allMessages) => {
    // Prepara histórico
    const preparedHistory = prepareRegenerateHistory(allMessages);
    if (!preparedHistory) {
      toast.error('Nenhuma mensagem do usuário encontrada');
      return { success: false };
    }

    setRegeneratingModel(modelId);

    try {
      const { isValid, apiKey } = await validateApiKey();
      if (!isValid) {
        toast.error('Configure sua API Key do OpenRouter');
        return { success: false };
      }

      const result = await callOpenRouter(apiKey, modelId, preparedHistory.history, {});

      // Salva nova resposta
      await saveAssistantMessage(conversationId, modelId, result.content, {
        prompt_tokens: result.usage?.prompt_tokens || 0,
        completion_tokens: result.usage?.completion_tokens || 0,
        total_tokens: result.usage?.total_tokens || 0,
        duration_ms: result.duration,
      });

      toast.success('Resposta regenerada!');
      queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.MESSAGES(conversationId) });
      
      return { success: true };
    } catch (err) {
      console.error('[useRegenerateResponse] Error:', err);
      toast.error('Falha ao regenerar: ' + err.message);
      return { success: false };
    } finally {
      setRegeneratingModel(null);
    }
  }, [conversationId, queryClient]);

  return { regenerate, regeneratingModel };
}

/**
 * Hook para chat expandido com modelo único
 */
export function useSingleModelChat(conversationId, modelId, allMessages) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (message) => {
    if (!message?.trim() || isLoading) return { success: false };

    setIsLoading(true);

    try {
      const { isValid, apiKey } = await validateApiKey();
      if (!isValid) {
        toast.error('Configure sua API Key do OpenRouter');
        return { success: false };
      }

      // Salva mensagem do usuário
      await saveUserMessage(conversationId, message.trim());

      // Prepara histórico
      const history = [
        ...prepareSingleModelHistory(allMessages, modelId),
        { role: 'user', content: message.trim() },
      ];

      const result = await callOpenRouter(apiKey, modelId, history, {});

      // Salva resposta
      await saveAssistantMessage(conversationId, modelId, result.content, {
        prompt_tokens: result.usage?.prompt_tokens || 0,
        completion_tokens: result.usage?.completion_tokens || 0,
        total_tokens: result.usage?.total_tokens || 0,
        duration_ms: result.duration,
      });

      queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.MESSAGES(conversationId) });
      return { success: true };
    } catch (err) {
      console.error('[useSingleModelChat] Error:', err);
      toast.error('Erro ao enviar: ' + err.message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, modelId, allMessages, isLoading, queryClient]);

  return { sendMessage, isLoading };
}

/**
 * Invalida queries relacionadas à conversa
 */
async function invalidateConversationQueries(queryClient, conversationId) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.MESSAGES(conversationId) }),
    queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] }),
    queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.CONVERSATION(conversationId) }),
  ]);
}