/**
 * Hook para envio de mensagens no Multi Chat
 * Chamada direta à OpenRouter do frontend
 */

import { useState, useCallback } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Busca API Key do usuário
 */
async function getUserApiKey() {
  const configs = await base44.entities.UserConfig.list();
  const config = configs?.[0];
  return config?.openrouter_api_key;
}

/**
 * Chama OpenRouter diretamente
 */
async function callOpenRouter(apiKey, model, messages, options = {}) {
  const body = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  };
  
  // Adiciona reasoning se habilitado e modelo suporta
  if (options.enableReasoning && model.includes('claude')) {
    body.reasoning = { effort: options.reasoningEffort || 'high' };
  }
  
  // Adiciona web search se habilitado
  if (options.enableWebSearch) {
    body.plugins = [{ id: 'web' }];
  }

  const startTime = Date.now();
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  const duration = Date.now() - startTime;
  
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
    duration,
  };
}



/**
 * Hook principal para envio de mensagens
 * Chama OpenRouter diretamente do frontend e salva no banco
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
      // Busca API Key do usuário
      const apiKey = await getUserApiKey();
      if (!apiKey) {
        toast.error('Configure sua API Key do OpenRouter nas configurações');
        return { success: false };
      }

      // Salva mensagem do usuário
      await base44.entities.TitanosMessage.create({
        conversation_id: conversationId,
        role: 'user',
        content: input.trim(),
        model_id: null,
      });

      // Prepara histórico efetivo
      let effectiveHistory = messages.filter(
        m => m.role === 'system' || m.role === 'user'
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

      // Adiciona mensagem atual ao histórico
      const fullHistory = [
        ...effectiveHistory,
        { role: 'user', content: input.trim() },
      ];

      const options = {
        enableReasoning: activeConversation?.enable_reasoning || false,
        reasoningEffort: activeConversation?.reasoning_effort || 'high',
        enableWebSearch: activeConversation?.enable_web_search || false,
      };

      // Envia para todos os modelos em paralelo
      const results = await Promise.allSettled(
        selectedModels.map(async (modelId) => {
          try {
            const result = await callOpenRouter(apiKey, modelId, fullHistory, options);
            
            // Salva resposta no banco
            await base44.entities.TitanosMessage.create({
              conversation_id: conversationId,
              role: 'assistant',
              content: result.content,
              model_id: modelId,
              metrics: {
                prompt_tokens: result.usage?.prompt_tokens || 0,
                completion_tokens: result.usage?.completion_tokens || 0,
                total_tokens: result.usage?.total_tokens || 0,
                duration_ms: result.duration,
              },
            });

            return { modelId, success: true };
          } catch (err) {
            console.error(`[useSendMessage] Error for ${modelId}:`, err);
            
            // Salva mensagem de erro
            await base44.entities.TitanosMessage.create({
              conversation_id: conversationId,
              role: 'assistant',
              content: `Erro: ${err.message}`,
              model_id: modelId,
              metrics: { error: true },
            });

            return { modelId, success: false, error: err.message };
          }
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      
      if (successCount === 0) {
        toast.error('Todos os modelos falharam');
      } else if (successCount < selectedModels.length) {
        toast.warning(`${successCount}/${selectedModels.length} modelos responderam`);
      }

      // Invalida queries para forçar refetch das mensagens
      await queryClient.invalidateQueries({ queryKey: ['titanos-messages', conversationId] });
      await queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });

      return { success: successCount > 0 };
    } catch (err) {
      toast.error('Falha ao enviar mensagem: ' + err.message);
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