/**
 * Hooks para busca de dados do Multi Chat
 * Centraliza todas as queries em um único lugar
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { STALE_TIMES, DEFAULT_CONVERSATION_LIMIT, TITANOS_QUERY_KEYS } from '../constants';

/**
 * Hook para dados do usuário atual
 */
export function useTitanosUser() {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.USER,
    queryFn: () => base44.auth.me(),
    staleTime: STALE_TIMES.USER,
    retry: 1,
  });
}

/**
 * Hook para modelos aprovados
 */
export function useApprovedModels() {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.APPROVED_MODELS,
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
    queryKey: TITANOS_QUERY_KEYS.GROUPS,
    queryFn: () => base44.entities.TitanosChatGroup.list('order', 50),
    staleTime: STALE_TIMES.GROUPS,
    select: (data) => data || [],
  });
}

/**
 * Hook para lista de conversas com paginação
 */
export function useTitanosConversations(limit = DEFAULT_CONVERSATION_LIMIT) {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.CONVERSATIONS(limit),
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
    queryKey: TITANOS_QUERY_KEYS.CONVERSATION(conversationId),
    queryFn: () => base44.entities.TitanosConversation.get(conversationId),
    enabled: !!conversationId,
    staleTime: STALE_TIMES.CONVERSATIONS,
  });
}

/**
 * Hook para mensagens de uma conversa
 */
export function useTitanosMessages(conversationId) {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.MESSAGES(conversationId),
    queryFn: async () => {
      const msgs = await base44.entities.TitanosMessage.filter({ 
        conversation_id: conversationId 
      });
      return msgs;
    },
    enabled: !!conversationId,
    staleTime: 0, // Sempre buscar dados frescos
    refetchOnMount: true,
    select: (data) => {
      if (!data) return [];
      return [...data].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
    },
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
    select: (data) => data || [],
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
    select: (data) => data || [],
  });
}

/**
 * Hook para configuração do usuário (API keys)
 */
export function useUserConfig() {
  return useQuery({
    queryKey: ['user-config'],
    queryFn: async () => {
      const configs = await base44.entities.UserConfig.list();
      return configs?.[0] || null;
    },
    staleTime: STALE_TIMES.USER,
  });
}