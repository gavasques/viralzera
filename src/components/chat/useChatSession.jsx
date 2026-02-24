import { useState, useCallback } from 'react';
import { neon } from "@/api/neonClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sendMessage } from './OpenRouterService';

/**
 * Hook unificado para gerenciar sessões de chat
 * 
 * @param {Object} params
 * @param {string} params.entityName - Nome da entidade (ex: 'AudienceChat')
 * @param {string} params.configEntityName - Nome da entidade de config (ex: 'AudienceConfig')
 * @param {string} params.focusId - ID do foco atual
 * @param {Function} params.buildSystemPrompt - Função para construir o system prompt
 */
export function useChatSession({
  entityName,
  configEntityName,
  focusId,
  buildSystemPrompt,
}) {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: [entityName, focusId],
    queryFn: () => neon.entities[entityName].filter(
      { focus_id: focusId }, 
      '-created_date', 
      100
    ),
    enabled: !!focusId
  });

  // Fetch config
  const { data: config } = useQuery({
    queryKey: [configEntityName],
    queryFn: async () => {
      const user = await neon.auth.me();
      const configs = await neon.entities[configEntityName].filter({ created_by: user.email });
      return configs[0] || null;
    },
    enabled: !!configEntityName
  });

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Create session
  const createMutation = useMutation({
    mutationFn: (data) => neon.entities[entityName].create(data),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
      setActiveSessionId(newSession.id);
      toast.success('Conversa criada!');
      return newSession;
    }
  });

  // Update session
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => neon.entities[entityName].update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
    }
  });

  // Delete session
  const deleteMutation = useMutation({
    mutationFn: (id) => neon.entities[entityName].delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] });
      if (activeSessionId) setActiveSessionId(null);
      toast.success('Conversa removida!');
    }
  });

  // Send message
  const sendChatMessage = useCallback(async (messageText, files = []) => {
    if (!activeSession) return;
    if (!config?.model) {
      toast.error('Configure o modelo nas configurações');
      return;
    }

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      files: files.length > 0 ? files.map(f => ({ name: f.name, type: f.type })) : undefined
    };

    const newMessages = [...(activeSession.messages || []), userMessage];
    
    // Update UI immediately
    updateMutation.mutate({
      id: activeSession.id,
      data: { messages: newMessages }
    });

    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt?.(activeSession, config) || config.prompt || '';
      
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...newMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await sendMessage({
        model: config.model,
        messages: apiMessages,
        options: {
          enableReasoning: config.enable_reasoning,
          reasoningEffort: config.reasoning_effort,
          enableWebSearch: config.enable_web_search,
          files,
        }
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        usage: response.usage,
        citations: response.citations,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      updateMutation.mutate({
        id: activeSession.id,
        data: { messages: updatedMessages }
      });

    } catch (error) {
      toast.error('Erro: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeSession, config, buildSystemPrompt, updateMutation]);

  // Rename session
  const renameSession = useCallback((sessionId, newTitle) => {
    updateMutation.mutate({
      id: sessionId,
      data: { title: newTitle }
    });
    toast.success('Conversa renomeada!');
  }, [updateMutation]);

  // Toggle favorite
  const toggleFavorite = useCallback((sessionId, isFavorite) => {
    updateMutation.mutate({
      id: sessionId,
      data: { is_favorite: isFavorite }
    });
    toast.success(isFavorite ? 'Adicionado aos favoritos!' : 'Removido dos favoritos!');
  }, [updateMutation]);

  // Create new session
  const createSession = useCallback(async (data) => {
    return createMutation.mutateAsync({
      focus_id: focusId,
      messages: [],
      status: 'active',
      is_favorite: false,
      ...data
    });
  }, [focusId, createMutation]);

  return {
    // State
    sessions,
    activeSession,
    activeSessionId,
    isLoading,
    loadingSessions,
    config,

    // Actions
    setActiveSessionId,
    sendMessage: sendChatMessage,
    createSession,
    deleteSession: deleteMutation.mutate,
    renameSession,
    toggleFavorite,
    updateSession: (data) => updateMutation.mutate({ id: activeSessionId, data }),
    
    // Mutation states
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}