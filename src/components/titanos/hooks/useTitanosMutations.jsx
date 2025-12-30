/**
 * Hooks para mutações do Multi Chat
 * Centraliza todas as operações de escrita
 * Refatorado com tratamento de erros e validações
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { TITANOS_QUERY_KEYS } from '../constants';

/**
 * Invalida queries relacionadas a conversas
 */
function invalidateConversationQueries(queryClient, conversationId = null) {
  queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
  if (conversationId) {
    queryClient.invalidateQueries({ queryKey: ['titanos-conversation', conversationId] });
  }
}

/**
 * Hook para mutações de conversa
 */
export function useConversationMutations(activeConversationId) {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: async (data) => {
      if (!activeConversationId) {
        throw new Error('ID da conversa não fornecido');
      }
      return base44.entities.TitanosConversation.update(activeConversationId, data);
    },
    onSuccess: () => {
      invalidateConversationQueries(queryClient, activeConversationId);
    },
    onError: (err) => {
      console.error('[useConversationMutations] Erro ao atualizar:', err);
      toast.error('Erro ao atualizar conversa');
    },
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      if (!id) {
        throw new Error('ID da conversa não fornecido');
      }
      return base44.entities.TitanosConversation.delete(id);
    },
    onSuccess: (_, deletedId) => {
      invalidateConversationQueries(queryClient);
      // Remove do cache imediatamente
      queryClient.removeQueries({ queryKey: ['titanos-conversation', deletedId] });
      queryClient.removeQueries({ queryKey: ['titanos-messages', deletedId] });
    },
    onError: (err) => {
      console.error('[useConversationMutations] Erro ao deletar:', err);
      toast.error('Erro ao excluir conversa');
    },
  });

  const create = useMutation({
    mutationFn: async (data) => {
      // Validação básica
      if (!data.title?.trim()) {
        throw new Error('Título é obrigatório');
      }
      
      const conversation = await base44.entities.TitanosConversation.create({
        title: data.title.trim(),
        selected_models: data.selected_models || [],
        group_id: data.group_id || null,
        enable_reasoning: data.enable_reasoning || false,
        reasoning_effort: data.reasoning_effort || 'high',
        enable_web_search: data.enable_web_search || false,
      });
      
      // Adiciona system prompt se fornecido
      if (data.systemPrompt?.trim()) {
        await base44.entities.TitanosMessage.create({
          conversation_id: conversation.id,
          role: 'system',
          content: data.systemPrompt.trim(),
          model_id: null,
        });
      }
      
      return conversation;
    },
    onSuccess: () => {
      invalidateConversationQueries(queryClient);
      toast.success('Conversa criada com sucesso!');
    },
    onError: (err) => {
      console.error('[useConversationMutations] Erro ao criar:', err);
      toast.error('Erro ao criar conversa: ' + (err.message || 'Erro desconhecido'));
    },
  });

  return { update, remove, create };
}

/**
 * Hook para mutações de grupo
 */
export function useGroupMutations() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async ({ id, data }) => {
      // Validação
      if (!data.name?.trim()) {
        throw new Error('Nome do grupo é obrigatório');
      }
      
      const groupData = {
        name: data.name.trim(),
        default_system_prompt: data.default_system_prompt?.trim() || null,
        color: data.color || null,
        order: data.order || 0,
      };
      
      if (id) {
        return base44.entities.TitanosChatGroup.update(id, groupData);
      }
      return base44.entities.TitanosChatGroup.create(groupData);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.GROUPS });
      toast.success(id ? 'Grupo atualizado!' : 'Grupo criado!');
    },
    onError: (err) => {
      console.error('[useGroupMutations] Erro:', err);
      toast.error('Erro ao salvar grupo');
    },
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      if (!id) {
        throw new Error('ID do grupo não fornecido');
      }
      
      // Move conversas do grupo para "sem grupo"
      const conversations = await base44.entities.TitanosConversation.filter({ group_id: id });
      if (conversations?.length > 0) {
        await Promise.all(
          conversations.map(c => base44.entities.TitanosConversation.update(c.id, { group_id: null }))
        );
      }
      
      return base44.entities.TitanosChatGroup.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.GROUPS });
      invalidateConversationQueries(queryClient);
      toast.success('Grupo excluído!');
    },
    onError: (err) => {
      console.error('[useGroupMutations] Erro ao excluir:', err);
      toast.error('Erro ao excluir grupo');
    },
  });

  return { save, remove };
}

/**
 * Hook para mutações de chat (atualização de conversa)
 */
export function useChatMutations() {
  const queryClient = useQueryClient();

  const updateChat = useMutation({
    mutationFn: async ({ chatId, data }) => {
      if (!chatId) {
        throw new Error('ID do chat não fornecido');
      }
      return base44.entities.TitanosConversation.update(chatId, data);
    },
    onSuccess: (_, { chatId }) => {
      invalidateConversationQueries(queryClient, chatId);
    },
    onError: (err) => {
      console.error('[useChatMutations] Erro:', err);
      toast.error('Erro ao atualizar chat');
    },
  });

  const renameChat = useMutation({
    mutationFn: async ({ id, title }) => {
      if (!id || !title?.trim()) {
        throw new Error('ID e título são obrigatórios');
      }
      return base44.entities.TitanosConversation.update(id, { title: title.trim() });
    },
    onSuccess: () => {
      invalidateConversationQueries(queryClient);
      toast.success('Chat renomeado!');
    },
    onError: (err) => {
      console.error('[useChatMutations] Erro ao renomear:', err);
      toast.error('Erro ao renomear chat');
    },
  });

  return { updateChat, renameChat };
}

/**
 * Hook para mutações de voto
 */
export function useVoteMutations(conversationId) {
  const queryClient = useQueryClient();

  const vote = useMutation({
    mutationFn: async ({ modelId, modelAlias, existingVote, allVotes, context }) => {
      if (!conversationId || !modelId) {
        throw new Error('Dados de voto incompletos');
      }
      
      // Se já votou neste modelo, remove
      if (existingVote) {
        await base44.entities.ModelVote.delete(existingVote.id);
        return { action: 'removed' };
      }
      
      // Remove votos anteriores do mesmo contexto
      if (allVotes?.length > 0) {
        await Promise.all(allVotes.map(v => base44.entities.ModelVote.delete(v.id)));
      }
      
      // Cria novo voto
      await base44.entities.ModelVote.create({
        conversation_id: conversationId,
        model_id: modelId,
        model_alias: modelAlias || modelId,
        vote_type: 'best',
        context: context || 'multi_chat',
      });
      
      return { action: 'voted', modelAlias };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.CONVERSATION_VOTES(conversationId) });
      queryClient.invalidateQueries({ queryKey: ['modelVotes'] });
      
      if (result.action === 'voted') {
        toast.success(`Você votou em ${result.modelAlias} como melhor resposta!`);
      } else {
        toast.success('Voto removido');
      }
    },
    onError: (err) => {
      console.error('[useVoteMutations] Erro:', err);
      toast.error('Erro ao registrar voto');
    },
  });

  return { vote };
}