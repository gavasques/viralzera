/**
 * Hooks para busca de dados do Multi Chat
 * Centraliza todas as queries em um único lugar
 * Refatorado para melhor performance e cache
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { STALE_TIMES, DEFAULT_CONVERSATION_LIMIT, TITANOS_QUERY_KEYS } from '../constants';

/**
 * Hook para dados do usuário atual
 * Cache longo pois dados do usuário mudam raramente
 */
export function useTitanosUser() {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.USER,
    queryFn: () => base44.auth.me(),
    staleTime: STALE_TIMES.USER,
    gcTime: 10 * 60 * 1000, // 10 min no cache
    retry: 2,
  });
}

/**
 * Hook para modelos aprovados
 * Cache médio, modelos são atualizados ocasionalmente
 */
export function useApprovedModels() {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.APPROVED_MODELS,
    queryFn: () => base44.entities.ApprovedModel.list('order', 100),
    staleTime: STALE_TIMES.MODELS,
    gcTime: 5 * 60 * 1000,
    select: (data) => data || [],
    retry: 2,
  });
}

/**
 * Hook para grupos de chat
 */
export function useTitanosGroups() {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.GROUPS,
    queryFn: () => base44.entities.TitanosChatGroup.list('order', 50),
    staleTime: STALE_TIMES.GROUPS,
    gcTime: 5 * 60 * 1000,
    select: (data) => data || [],
    retry: 2,
  });
}

/**
 * Hook para lista de conversas
 * Usa keepPreviousData para UX suave durante paginação
 */
export function useTitanosConversations(limit = DEFAULT_CONVERSATION_LIMIT) {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.CONVERSATIONS(limit),
    queryFn: () => base44.entities.TitanosConversation.list('-created_date', limit),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.CONVERSATIONS,
    gcTime: 2 * 60 * 1000,
    select: (data) => data || [],
    retry: 2,
  });
}

/**
 * Hook para uma conversa específica
 * Cache curto pois pode ser atualizada frequentemente
 */
export function useTitanosConversation(conversationId) {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.CONVERSATION(conversationId),
    queryFn: () => base44.entities.TitanosConversation.get(conversationId),
    enabled: !!conversationId,
    staleTime: 30 * 1000, // 30s
    gcTime: 60 * 1000,
    retry: 2,
  });
}

/**
 * Hook para mensagens de uma conversa
 * Sempre busca dados frescos para garantir sincronização
 */
export function useTitanosMessages(conversationId) {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.MESSAGES(conversationId),
    queryFn: async () => {
      if (!conversationId) return [];
      const msgs = await base44.entities.TitanosMessage.filter({ 
        conversation_id: conversationId 
      });
      return msgs || [];
    },
    enabled: !!conversationId,
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Evita refetch desnecessário
    select: (data) => 
      (data || []).sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
    retry: 2,
  });
}

/**
 * Hook para votos de uma conversa
 */
export function useConversationVotes(conversationId) {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.CONVERSATION_VOTES(conversationId),
    queryFn: () => base44.entities.ModelVote.filter({ conversation_id: conversationId }),
    enabled: !!conversationId,
    staleTime: 60 * 1000, // 1 min
    gcTime: 5 * 60 * 1000,
    select: (data) => data || [],
    retry: 2,
  });
}

/**
 * Hook para prompts salvos
 */
export function useSavedPrompts() {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.PROMPTS,
    queryFn: () => base44.entities.Prompt.list('-created_date', 100),
    staleTime: STALE_TIMES.PROMPTS,
    gcTime: 5 * 60 * 1000,
    select: (data) => data || [],
    retry: 2,
  });
}