/**
 * Hook para envio de mensagens no Multi Chat
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Invoca função backend via fetch direto
 * O SDK não expõe base44.functions, então usamos fetch
 */
async function invokeFunction(functionName, payload) {
  const config = base44.getConfig?.() || {};
  const token = config.token;
  const appId = config.appId;
  
  // Monta a URL base correta
  const baseUrl = `https://api.base44.com/v1/apps/${appId}/functions/${functionName}`;
  
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  
  const data = await response.json();
  return { data, status: response.status };
}



/**
 * Hook principal para envio de mensagens
 */
export function useSendMessage(conversationId, activeConversation, messages, groups) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (input, selectedModels) => {
    if (!input?.trim() || !conversationId || selectedModels.length === 0) {
      return { success: false };
    }

    setIsLoading(true);

    try {
      // Prepara histórico efetivo
      let effectiveHistory = messages.filter(
        m => m.model_id === null || selectedModels.includes(m.model_id)
      );

      // Verifica system prompt do grupo
      if (activeConversation?.group_id) {
        const group = groups.find(g => g.id === activeConversation.group_id);
        if (group?.default_system_prompt) {
          const hasOwnSystemPrompt = messages.some(m => m.role === 'system');
          if (!hasOwnSystemPrompt) {
            effectiveHistory = [
              { role: 'system', content: group.default_system_prompt },
              ...effectiveHistory.filter(m => m.role !== 'system'),
            ];
          }
        }
      }

      const res = await invokeFunction('titanosChat', {
        message: input.trim(),
        conversationId,
        selectedModels,
        history: effectiveHistory,
        enableReasoning: activeConversation?.enable_reasoning || false,
        reasoningEffort: activeConversation?.reasoning_effort || 'high',
        enableWebSearch: activeConversation?.enable_web_search || false,
      });

      console.log('[useSendMessage] Response:', res);
      
      if (res.data?.error) {
        toast.error(`Erro: ${res.data.error}`);
        return { success: false };
      }

      // Invalida queries para forçar refetch das mensagens
      console.log('[useSendMessage] Invalidating queries for conversation:', conversationId);
      await queryClient.invalidateQueries({ queryKey: ['titanos-messages', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['titanos-conversation', conversationId] });

      return { success: true };
    } catch (err) {
      toast.error('Falha ao enviar mensagem');
      console.error(err);
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

  const regenerate = useCallback(async (modelId, messages) => {
    const userMessages = messages.filter(m => m.role === 'user' && !m.model_id);
    if (userMessages.length === 0) {
      toast.error('Nenhuma mensagem do usuário encontrada');
      return;
    }

    const firstUserMessage = userMessages[0];
    const history = messages
      .filter(m => m.role === 'system')
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    setRegeneratingModel(modelId);

    try {
      const res = await invokeFunction('titanosChatSingle', {
        message: firstUserMessage.content,
        conversationId,
        modelId,
        history,
        saveUserMessage: false,
      });

      if (res.data?.error) {
        toast.error(`Erro: ${res.data.error}`);
      } else {
        toast.success('Resposta regenerada!');
        queryClient.invalidateQueries({ queryKey: ['titanos-messages', conversationId] });
      }
    } catch (err) {
      toast.error('Falha ao regenerar');
      console.error(err);
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

  const getHistoryForModel = useCallback(() => {
    return allMessages
      .filter(m => m.role === 'system' || m.role === 'user' || m.model_id === modelId)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [allMessages, modelId]);

  const sendMessage = useCallback(async (message) => {
    if (!message?.trim() || isLoading) return { success: false };

    setIsLoading(true);

    try {
      const res = await invokeFunction('titanosChatSingle', {
        message: message.trim(),
        conversationId,
        modelId,
        history: getHistoryForModel(),
        saveUserMessage: true,
      });

      if (res.data?.error) {
        toast.error('Erro ao enviar: ' + res.data.error);
        return { success: false };
      }

      queryClient.invalidateQueries({ queryKey: ['titanos-messages', conversationId] });
      return { success: true };
    } catch (err) {
      toast.error('Erro ao enviar: ' + err.message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, modelId, isLoading, getHistoryForModel, queryClient]);

  return { sendMessage, isLoading };
}