import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

/**
 * Unified hook for managing chat sessions (CRUD operations)
 * Works with any chat entity (AudienceChat, PersonaChat, ProductChat, ScriptChat)
 * 
 * @param {Object} options
 * @param {string} options.entityName - Entity name (e.g., 'AudienceChat')
 * @param {Function} options.queryKeyFn - Function to generate query key: (focusId, limit) => [...]
 * @param {string} options.focusId - Current focus ID
 * @param {number} options.initialLimit - Initial limit for fetching sessions
 */
export function useChatSession({
  entityName,
  queryKeyFn,
  focusId,
  initialLimit = 20
}) {
  const queryClient = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [limit, setLimit] = useState(initialLimit);

  const entity = base44.entities[entityName];
  const queryKey = queryKeyFn(focusId, limit);

  // Fetch sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey,
    queryFn: () => entity.filter({ focus_id: focusId }, '-created_date', limit),
    enabled: !!focusId,
    staleTime: 30000
  });

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const hasMore = sessions.length >= limit;

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: (data) => entity.create({
      ...data,
      focus_id: focusId,
      status: 'active'
    }),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: queryKeyFn(focusId, limit) });
      setActiveSessionId(newSession.id);
      toast.success('Sessão criada!');
    },
    onError: () => toast.error('Erro ao criar sessão')
  });

  // Update session mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entity.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSessions = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return [];
        return old.map(session => 
          session.id === id ? { ...session, ...data } : session
        );
      });
      
      return { previousSessions };
    },
    onError: (err, variables, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(queryKey, context.previousSessions);
      }
      toast.error('Erro ao atualizar sessão');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyFn(focusId, limit) });
    }
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => entity.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeyFn(focusId, limit) });
      if (activeSessionId === deletedId) {
        setActiveSessionId(null);
      }
      toast.success('Sessão excluída!');
    },
    onError: () => toast.error('Erro ao excluir sessão')
  });

  // Rename session mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }) => entity.update(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyFn(focusId, limit) });
      toast.success('Renomeado!');
    }
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => entity.update(id, { is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyFn(focusId, limit) });
    }
  });

  // Action handlers
  const createSession = useCallback((data) => {
    return createMutation.mutateAsync(data);
  }, [createMutation]);

  const updateSession = useCallback((updatedSession) => {
    updateMutation.mutate({ 
      id: updatedSession.id, 
      data: { 
        messages: updatedSession.messages,
        total_tokens: updatedSession.total_tokens
      }
    });
  }, [updateMutation]);

  const deleteSession = useCallback((id) => {
    if (confirm('Excluir esta sessão?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const renameSession = useCallback((id, newTitle) => {
    renameMutation.mutate({ id, title: newTitle });
  }, [renameMutation]);

  const toggleFavorite = useCallback((id) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      favoriteMutation.mutate({ id, is_favorite: !session.is_favorite });
    }
  }, [sessions, favoriteMutation]);

  const loadMore = useCallback(() => {
    setLimit(prev => prev + 20);
  }, []);

  return {
    // State
    sessions,
    activeSession,
    activeSessionId,
    isLoadingSessions,
    hasMore,
    
    // Setters
    setActiveSessionId,
    
    // Actions
    createSession,
    updateSession,
    deleteSession,
    renameSession,
    toggleFavorite,
    loadMore,
    
    // Mutations (for checking pending state)
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}