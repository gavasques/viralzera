/**
 * Hook para envio de mensagens no Multi Chat
 * Chamada direta à OpenRouter do frontend (sem backend)
 */

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { validateOpenRouterResponse } from '../utils/sanitize';

// Cache de API Key com TTL
const apiKeyCache = {
  key: null,
  timestamp: 0,
  TTL: 5 * 60 * 1000, // 5 minutos
};

/**
 * Busca API Key do usuário (com cache e TTL)
 */
async function getUserApiKey() {
  const now = Date.now();
  
  // Retorna do cache se ainda válido
  if (apiKeyCache.key && (now - apiKeyCache.timestamp) < apiKeyCache.TTL) {
    return apiKeyCache.key;
  }
  
  const configs = await base44.entities.UserConfig.list();
  const config = configs?.[0];
  
  // Atualiza cache
  apiKeyCache.key = config?.openrouter_api_key || null;
  apiKeyCache.timestamp = now;
  
  return apiKeyCache.key;
}

/**
 * Invalida o cache da API Key (útil quando usuário atualiza configurações)
 */
export function invalidateApiKeyCache() {
  apiKeyCache.key = null;
  apiKeyCache.timestamp = 0;
}

/**
 * Chama OpenRouter diretamente com retry e validação
 */
async function callOpenRouter(apiKey, model, messages, options = {}) {
  if (!apiKey) {
    throw new Error('API Key não configurada');
  }

  if (!model) {
    throw new Error('Modelo não especificado');
  }

  const body = {
    model,
    messages: messages.map(m => ({ 
      role: m.role, 
      content: typeof m.content === 'string' ? m.content : String(m.content) 
    })),
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
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Multi Chat',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `OpenRouter error: ${response.status}`;
      
      // Log para debug (sem expor dados sensíveis)
      console.error('[OpenRouter] Request failed:', {
        status: response.status,
        model,
        errorMessage,
      });
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    
    // Valida resposta
    const validated = validateOpenRouterResponse(data);
    
    return {
      content: validated.content,
      usage: validated.usage,
      duration,
      rawResponse: data,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: A requisição demorou muito');
    }
    
    throw error;
  }
}



/**
 * Hook principal para envio de mensagens
 */
export function useSendMessage(conversationId, activeConversation, messages, groups) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef(false);

  const sendMessage = useCallback(async (input, selectedModels) => {
    // Validações iniciais
    if (!input?.trim()) {
      return { success: false, error: 'Mensagem vazia' };
    }
    
    if (!conversationId) {
      return { success: false, error: 'Nenhuma conversa selecionada' };
    }
    
    if (!selectedModels || selectedModels.length === 0) {
      toast.warning('Selecione pelo menos um modelo');
      return { success: false, error: 'Nenhum modelo selecionado' };
    }

    // Previne múltiplos envios simultâneos
    if (isLoading) {
      return { success: false, error: 'Envio em andamento' };
    }

    setIsLoading(true);
    abortRef.current = false;

    try {
      // Busca API Key do usuário
      const apiKey = await getUserApiKey();
      if (!apiKey) {
        toast.error('Configure sua API Key do OpenRouter em Configurações');
        return { success: false, error: 'API Key não configurada' };
      }

      // Prepara histórico efetivo
      let effectiveHistory = messages.filter(
        m => m.model_id === null || selectedModels.includes(m.model_id)
      );

      // Verifica system prompt do grupo
      if (activeConversation?.group_id && groups) {
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

      const trimmedInput = input.trim();

      // Salva mensagem do usuário no banco
      await base44.entities.TitanosMessage.create({
        conversation_id: conversationId,
        role: 'user',
        content: trimmedInput,
        model_id: null,
      });

      // Prepara mensagens para envio
      const historyMessages = [
        ...effectiveHistory.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: trimmedInput },
      ];

      // Configurações da conversa
      const options = {
        enableReasoning: activeConversation?.enable_reasoning || false,
        reasoningEffort: activeConversation?.reasoning_effort || 'high',
        enableWebSearch: activeConversation?.enable_web_search || false,
      };

      // Chama cada modelo em paralelo
      // selectedModels aqui já são os model_ids do OpenRouter (convertidos pelo handler)
      const results = await Promise.allSettled(
        selectedModels.map(async (openRouterId) => {
          if (abortRef.current) {
            return { modelId: openRouterId, success: false, error: 'Abortado' };
          }
          
          try {
            const result = await callOpenRouter(apiKey, openRouterId, historyMessages, options);
            
            // Salva resposta no banco usando o model_id do OpenRouter
            await base44.entities.TitanosMessage.create({
              conversation_id: conversationId,
              role: 'assistant',
              content: result.content,
              model_id: openRouterId,
              metrics: {
                prompt_tokens: result.usage?.prompt_tokens || 0,
                completion_tokens: result.usage?.completion_tokens || 0,
                total_tokens: result.usage?.total_tokens || 0,
                duration_ms: result.duration,
                cost: result.usage?.cost || 0,
              },
            });
            
            return { modelId: openRouterId, success: true };
          } catch (err) {
            console.error(`[useSendMessage] Error for ${openRouterId}:`, err.message);
            return { modelId: openRouterId, success: false, error: err.message };
          }
        })
      );

      // Conta falhas
      const failures = results.filter(r => r.status === 'rejected' || !r.value?.success);
      const successes = results.length - failures.length;
      
      if (successes === 0) {
        toast.error('Falha em todos os modelos');
        return { success: false, error: 'Todos os modelos falharam' };
      }
      
      if (failures.length > 0) {
        toast.warning(`${failures.length} modelo(s) falharam`);
      }

      // Invalida queries para forçar refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['titanos-messages', conversationId] }),
        queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['titanos-conversation', conversationId] }),
      ]);

      return { success: true, successCount: successes, failureCount: failures.length };
    } catch (err) {
      console.error('[useSendMessage] Error:', err);
      toast.error('Falha ao enviar mensagem');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, activeConversation, messages, groups, queryClient, isLoading]);

  // Função para abortar envio em andamento
  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { sendMessage, isLoading, abort };
}

/**
 * Hook para regenerar resposta de um modelo específico
 */
export function useRegenerateResponse(conversationId) {
  const queryClient = useQueryClient();
  const [regeneratingModel, setRegeneratingModel] = useState(null);

  const regenerate = useCallback(async (modelId, messages) => {
    if (!conversationId || !modelId) {
      toast.error('Dados inválidos para regeneração');
      return { success: false };
    }

    const userMessages = messages.filter(m => m.role === 'user' && !m.model_id);
    if (userMessages.length === 0) {
      toast.error('Nenhuma mensagem do usuário encontrada');
      return { success: false };
    }

    // Já está regenerando este modelo
    if (regeneratingModel === modelId) {
      return { success: false };
    }

    const firstUserMessage = userMessages[0];
    const systemMessages = messages
      .filter(m => m.role === 'system')
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    setRegeneratingModel(modelId);

    try {
      const apiKey = await getUserApiKey();
      if (!apiKey) {
        toast.error('Configure sua API Key do OpenRouter');
        return { success: false };
      }

      const historyMessages = [
        ...systemMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: firstUserMessage.content },
      ];

      const result = await callOpenRouter(apiKey, modelId, historyMessages, {});

      // Salva nova resposta no banco
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

      toast.success('Resposta regenerada!');
      await queryClient.invalidateQueries({ queryKey: ['titanos-messages', conversationId] });
      
      return { success: true };
    } catch (err) {
      console.error('[useRegenerateResponse] Error:', err.message);
      toast.error('Falha ao regenerar: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setRegeneratingModel(null);
    }
  }, [conversationId, queryClient, regeneratingModel]);

  return { regenerate, regeneratingModel };
}

/**
 * Hook para chat expandido com modelo único
 */
export function useSingleModelChat(conversationId, modelId, allMessages) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const getHistoryForModel = useCallback(() => {
    if (!allMessages || !Array.isArray(allMessages)) return [];
    
    return allMessages
      .filter(m => m.role === 'system' || m.role === 'user' || m.model_id === modelId)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [allMessages, modelId]);

  const sendMessage = useCallback(async (message) => {
    // Validações
    if (!message?.trim()) {
      return { success: false, error: 'Mensagem vazia' };
    }
    
    if (!conversationId || !modelId) {
      toast.error('Dados inválidos');
      return { success: false, error: 'Dados inválidos' };
    }
    
    if (isLoading) {
      return { success: false, error: 'Envio em andamento' };
    }

    setIsLoading(true);

    try {
      const apiKey = await getUserApiKey();
      if (!apiKey) {
        toast.error('Configure sua API Key do OpenRouter');
        return { success: false, error: 'API Key não configurada' };
      }

      const trimmedMessage = message.trim();

      // Salva mensagem do usuário
      await base44.entities.TitanosMessage.create({
        conversation_id: conversationId,
        role: 'user',
        content: trimmedMessage,
        model_id: null,
      });

      const historyMessages = [
        ...getHistoryForModel().map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: trimmedMessage },
      ];

      const result = await callOpenRouter(apiKey, modelId, historyMessages, {});

      // Salva resposta
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

      await queryClient.invalidateQueries({ queryKey: ['titanos-messages', conversationId] });
      return { success: true };
    } catch (err) {
      console.error('[useSingleModelChat] Error:', err.message);
      toast.error('Erro ao enviar: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, modelId, isLoading, getHistoryForModel, queryClient]);

  return { sendMessage, isLoading };
}