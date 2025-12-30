/**
 * Hooks para busca de dados do Multi Chat
 * Centraliza todas as queries em um único lugar
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TITANOS_QUERY_KEYS, STALE_TIMES, DEFAULT_CONVERSATION_LIMIT } from '../constants';

/**
 * Hook para dados do usuário atual
 */
export function useTitanosUser() {
  return useQuery({
    queryKey: ['titanos-user'],
    queryFn: () => base44.auth.me(),
    staleTime: STALE_TIMES.USER,
  });
}

/**
 * Hook para modelos aprovados
 */
export function useApprovedModels() {
  return useQuery({
    queryKey: ['titanos-approved-models'],
    queryFn: () => base44.entities.ApprovedModel.list('order', 100),
    staleTime: STALE_TIMES.MODELS,
    select: (data) => data || [],
  });
}

/**
 * Hook para grupos de chat
 */
export function useTitanosGroups() {
  return useQuery({
    queryKey: ['titanos-groups'],
    queryFn: () => base44.entities.TitanosChatGroup.list('order', 50),
    staleTime: STALE_TIMES.GROUPS,
    select: (data) => data || [],
  });
}

/**
 * Hook para lista de conversas
 */
export function useTitanosConversations(limit = DEFAULT_CONVERSATION_LIMIT) {
  return useQuery({
    queryKey: ['titanos-conversations', limit],
    queryFn: () => base44.entities.TitanosConversation.list('-created_date', limit),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.CONVERSATIONS,
    select: (data) => data || [],
  });
}

/**
 * Hook para uma conversa específica
 */
export function useTitanosConversation(conversationId) {
  return useQuery({
    queryKey: ['titanos-conversation', conversationId],
    queryFn: () => base44.entities.TitanosConversation.get(conversationId),
    enabled: !!conversationId,
  });
}

/**
 * Hook para mensagens de uma conversa
 */
export function useTitanosMessages(conversationId, isLoading = false) {
  return useQuery({
    queryKey: ['titanos-messages', conversationId],
    queryFn: () => base44.entities.TitanosMessage.filter({ conversation_id: conversationId }),
    enabled: !!conversationId,
    refetchInterval: isLoading ? 1000 : false,
    staleTime: STALE_TIMES.MESSAGES,
    select: (data) => data || [],
  });
}

/**
 * Hook para votos de uma conversa
 */
export function useConversationVotes(conversationId) {
  return useQuery({
    queryKey: ['titanos-votes', conversationId],
    queryFn: () => base44.entities.ModelVote.filter({ conversation_id: conversationId }),
    enabled: !!conversationId,
    select: (data) => data || [],
  });
}

/**
 * Hook para prompts salvos
 */
export function useSavedPrompts() {
  return useQuery({
    queryKey: ['titanos-prompts'],
    queryFn: () => base44.entities.Prompt.list('-created_date', 100),
    staleTime: STALE_TIMES.PROMPTS,
    select: (data) => data || [],
  });
}