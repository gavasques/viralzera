/**
 * Hook para envio de mensagens no Multi Chat
 * Refatorado com SOLID e separação de responsabilidades
 */

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Services
import { 
  callOpenRouter, 
  prepareMessagesForSend, 
  OpenRouterError, 
  ERROR_CODES,
  sanitizeInput 
} from '../services/OpenRouterService';
import { getApiKey } from '../services/ApiKeyService';
import { 
  createUserMessage, 
  createAssistantMessage, 
  prepareEffectiveHistory 
} from '../services/MessageService';

// Constants
import { TITANOS_QUERY_KEYS } from '../constants';

/**
 * Invalida queries relacionadas a uma conversa
 */
function invalidateConversationQueries(queryClient, conversationId) {
  queryClient.invalidateQueries({ queryKey: ['titanos-messages', conversationId] });
  queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
  queryClient.invalidateQueries({ queryKey: ['titanos-conversation', conversationId] });
}

/**
 * Trata erros de forma padronizada
 */
function handleError(error, defaultMessage = 'Erro desconhecido') {
  console.error('[useSendMessage]', error);
  
  if (error instanceof OpenRouterError) {
    switch (error.code) {
      case ERROR_CODES.NO_API_KEY:
        toast.error('Configure sua API Key do OpenRouter em Configurações');
        break;
      case ERROR_CODES.INVALID_API_KEY:
        toast.error('API Key inválida. Verifique suas configurações.');
        break;
      case ERROR_CODES.RATE_LIMITED:
        toast.error('Limite de requisições atingido. Aguarde um momento.');
        break;
      case ERROR_CODES.TIMEOUT:
        toast.error('Timeout na requisição. Tente novamente.');
        break;
      default:
        toast.error(error.message || defaultMessage);
    }
  } else {
    toast.error(error?.message || defaultMessage);
  }
}

/**
 * Hook principal para envio de mensagens
 */
export function useSendMessage(conversationId, activeConversation, messages, groups) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const sendMessage = useCallback(async (input, selectedModels) => {
    // Validações iniciais
    const sanitizedInput = sanitizeInput(input);
    if (!sanitizedInput || !conversationId || !selectedModels?.length) {
      return { success: false };
    }

    // Cancela requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      // Busca API Key
      const apiKey = await getApiKey();
      if (!apiKey) {
        toast.error('Configure sua API Key do OpenRouter em Configurações');
        return { success: false };
      }

      // Prepara histórico efetivo
      const groupSystemPrompt = activeConversation?.group_id
        ? groups.find(g => g.id === activeConversation.group_id)?.default_system_prompt
        : null;
      
      const effectiveHistory = prepareEffectiveHistory(messages, selectedModels, groupSystemPrompt);

      // Salva mensagem do usuário no banco (antes de chamar modelos)
      await createUserMessage(conversationId, sanitizedInput);

      // Prepara mensagens para envio
      const historyMessages = prepareMessagesForSend(effectiveHistory, sanitizedInput);

      // Opções para OpenRouter
      const options = {
        enableReasoning: activeConversation?.enable_reasoning || false,
        reasoningEffort: activeConversation?.reasoning_effort || 'high',
        enableWebSearch: activeConversation?.enable_web_search || false,
      };

      // Chama cada modelo em paralelo com Promise.allSettled
      const results = await Promise.allSettled(
        selectedModels.map(async (modelId) => {
          try {
            const result = await callOpenRouter(apiKey, modelId, historyMessages, options);
            
            // Salva resposta no banco
            await createAssistantMessage(conversationId, modelId, result.content, {
              prompt_tokens: result.usage?.prompt_tokens,
              completion_tokens: result.usage?.completion_tokens,
              total_tokens: result.usage?.total_tokens,
              duration: result.duration,
              cost: result.usage?.cost,
            });
            
            return { modelId, success: true };
          } catch (err) {
            console.error(`[useSendMessage] Erro no modelo ${modelId}:`, err.message);
            return { modelId, success: false, error: err.message };
          }
        })
      );

      // Analisa resultados
      const successes = results.filter(r => r.status === 'fulfilled' && r.value?.success);
      const failures = results.filter(r => r.status === 'rejected' || !r.value?.success);
      
      // Feedback ao usuário
      if (failures.length === selectedModels.length) {
        toast.error('Falha em todos os modelos');
        return { success: false };
      }
      
      if (failures.length > 0) {
        toast.warning(`${failures.length} modelo(s) falharam`);
      }

      // Invalida queries para forçar refetch
      invalidateConversationQueries(queryClient, conversationId);

      return { success: true, successCount: successes.length, failureCount: failures.length };
      
    } catch (err) {
      handleError(err, 'Falha ao enviar mensagem');
      return { success: false };
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, activeConversation, messages, groups, queryClient]);

  // Cancela requisições pendentes ao desmontar
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { sendMessage, isLoading, cancel };
}

/**
 * Hook para regenerar resposta de um modelo específico
 */
export function useRegenerateResponse(conversationId) {
  const queryClient = useQueryClient();
  const [regeneratingModel, setRegeneratingModel] = useState(null);

  const regenerate = useCallback(async (modelId, allMessages) => {
    // Validações
    if (!conversationId || !modelId || regeneratingModel) return;
    
    const userMessages = allMessages.filter(m => m.role === 'user' && !m.model_id);
    if (userMessages.length === 0) {
      toast.error('Nenhuma mensagem do usuário encontrada');
      return;
    }

    setRegeneratingModel(modelId);

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        toast.error('Configure sua API Key do OpenRouter');
        return;
      }

      // Prepara histórico (system + todas as mensagens do usuário)
      const history = allMessages
        .filter(m => m.role === 'system' || (m.role === 'user' && !m.model_id))
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      
      const historyMessages = history.map(m => ({ role: m.role, content: m.content }));

      const result = await callOpenRouter(apiKey, modelId, historyMessages, {});

      // Salva nova resposta
      await createAssistantMessage(conversationId, modelId, result.content, {
        prompt_tokens: result.usage?.prompt_tokens,
        completion_tokens: result.usage?.completion_tokens,
        total_tokens: result.usage?.total_tokens,
        duration: result.duration,
      });

      toast.success('Resposta regenerada!');
      invalidateConversationQueries(queryClient, conversationId);
      
    } catch (err) {
      handleError(err, 'Falha ao regenerar resposta');
    } finally {
      setRegeneratingModel(null);
    }
  }, [conversationId, regeneratingModel, queryClient]);

  return { regenerate, regeneratingModel };
}

/**
 * Hook para chat expandido com modelo único
 */
export function useSingleModelChat(conversationId, modelId, allMessages) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const getHistoryForModel = useCallback(() => {
    return allMessages
      .filter(m => m.role === 'system' || m.role === 'user' || m.model_id === modelId)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [allMessages, modelId]);

  const sendMessage = useCallback(async (message) => {
    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage || isLoading || !conversationId || !modelId) {
      return { success: false };
    }

    setIsLoading(true);

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        toast.error('Configure sua API Key do OpenRouter');
        return { success: false };
      }

      // Salva mensagem do usuário
      await createUserMessage(conversationId, sanitizedMessage);

      // Prepara histórico
      const historyMessages = prepareMessagesForSend(getHistoryForModel(), sanitizedMessage);

      const result = await callOpenRouter(apiKey, modelId, historyMessages, {});

      // Salva resposta
      await createAssistantMessage(conversationId, modelId, result.content, {
        prompt_tokens: result.usage?.prompt_tokens,
        completion_tokens: result.usage?.completion_tokens,
        total_tokens: result.usage?.total_tokens,
        duration: result.duration,
      });

      invalidateConversationQueries(queryClient, conversationId);
      return { success: true };
      
    } catch (err) {
      handleError(err, 'Erro ao enviar mensagem');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, modelId, isLoading, getHistoryForModel, queryClient]);

  return { sendMessage, isLoading };
}