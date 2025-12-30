/**
 * Hooks para busca de dados do Multi Chat
 * Centraliza todas as queries em um único lugar
 * 
 * Otimizações:
 * - Stale times configuráveis por tipo de dado
 * - Cache compartilhado via query keys
 * - Ordenação no cliente quando possível
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
    gcTime: 10 * 60 * 1000, // 10 min garbage collection
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
    gcTime: 5 * 60 * 1000,
    select: (data) => {
      if (!data) return [];
      // Filtra apenas modelos ativos
      return data.filter(m => m.is_active !== false);
    },
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
    gcTime: 10 * 60 * 1000,
    select: (data) => data || [],
  });
}

/**
 * Hook para lista de conversas
 */
export function useTitanosConversations(limit = DEFAULT_CONVERSATION_LIMIT) {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.CONVERSATIONS(limit),
    queryFn: () => base44.entities.TitanosConversation.list('-created_date', limit),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIMES.CONVERSATIONS,
    gcTime: 5 * 60 * 1000,
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
    staleTime: 30 * 1000, // 30s
  });
}

/**
 * Hook para mensagens de uma conversa
 */
export function useTitanosMessages(conversationId) {
  return useQuery({
    queryKey: TITANOS_QUERY_KEYS.MESSAGES(conversationId),
    queryFn: () => base44.entities.TitanosMessage.filter({ conversation_id: conversationId }),
    enabled: !!conversationId,
    staleTime: 5 * 1000, // 5s - reduzido para melhor UX
    refetchOnMount: true,
    select: (data) => {
      if (!data || !Array.isArray(data)) return [];
      // Ordenação no cliente para evitar re-fetch
      return [...data].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
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
    staleTime: 60 * 1000, // 1 min
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
    gcTime: 10 * 60 * 1000,
    select: (data) => data || [],
  });
}