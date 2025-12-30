/**
 * Hooks para mutações do Multi Chat
 * Centraliza todas as operações de escrita
 * 
 * Princípios:
 * - Invalidação otimista de cache
 * - Feedback de sucesso/erro via toast
 * - Operações atômicas quando possível
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { TITANOS_QUERY_KEYS } from '../constants';
import { sanitizeTitle, sanitizeSystemPrompt } from '../utils/sanitize';

/**
 * Hook para mutações de conversa
 */
export function useConversationMutations(activeConversationId) {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: (data) => {
      if (!activeConversationId) {
        throw new Error('Nenhuma conversa selecionada');
      }
      return base44.entities.TitanosConversation.update(activeConversationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.CONVERSATION(activeConversationId) });
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
    },
    onError: (err) => {
      console.error('[useConversationMutations] Update error:', err.message);
    },
  });

  const remove = useMutation({
    mutationFn: (id) => {
      if (!id) throw new Error('ID inválido');
      return base44.entities.TitanosConversation.delete(id);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
      // Remove a conversa do cache
      queryClient.removeQueries({ queryKey: TITANOS_QUERY_KEYS.CONVERSATION(deletedId) });
      queryClient.removeQueries({ queryKey: TITANOS_QUERY_KEYS.MESSAGES(deletedId) });
      toast.success('Conversa excluída');
    },
    onError: (err) => {
      toast.error('Erro ao excluir: ' + (err.message || 'Erro desconhecido'));
    },
  });

  const create = useMutation({
    mutationFn: async (data) => {
      // Sanitiza dados de entrada
      const sanitizedData = {
        ...data,
        title: sanitizeTitle(data.title) || 'Nova Conversa',
      };

      const conversation = await base44.entities.TitanosConversation.create(sanitizedData);
      
      // Adiciona system prompt se fornecido
      if (data.systemPrompt) {
        const sanitizedPrompt = sanitizeSystemPrompt(data.systemPrompt);
        if (sanitizedPrompt) {
          await base44.entities.TitanosMessage.create({
            conversation_id: conversation.id,
            role: 'system',
            content: sanitizedPrompt,
            model_id: null,
          });
        }
      }
      
      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
      toast.success('Conversa criada com sucesso!');
    },
    onError: (err) => {
      console.error('[useConversationMutations] Create error:', err);
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
      // Sanitiza título do grupo
      const sanitizedData = {
        ...data,
        title: sanitizeTitle(data.title) || 'Novo Grupo',
        default_system_prompt: data.default_system_prompt 
          ? sanitizeSystemPrompt(data.default_system_prompt) 
          : null,
      };

      if (id) {
        return base44.entities.TitanosChatGroup.update(id, sanitizedData);
      }
      return base44.entities.TitanosChatGroup.create(sanitizedData);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.GROUPS });
      toast.success(id ? 'Grupo atualizado!' : 'Grupo criado!');
    },
    onError: (err) => {
      toast.error('Erro: ' + (err.message || 'Erro desconhecido'));
    },
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error('ID do grupo inválido');
      
      // Move conversas do grupo para "sem grupo"
      const conversations = await base44.entities.TitanosConversation.filter({ group_id: id });
      
      if (conversations.length > 0) {
        await Promise.all(
          conversations.map(c => base44.entities.TitanosConversation.update(c.id, { group_id: null }))
        );
      }
      
      return base44.entities.TitanosChatGroup.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.GROUPS });
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
      toast.success('Grupo excluído!');
    },
    onError: (err) => {
      toast.error('Erro ao excluir grupo: ' + (err.message || 'Erro desconhecido'));
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
    mutationFn: ({ chatId, data }) => {
      if (!chatId) throw new Error('ID do chat inválido');
      return base44.entities.TitanosConversation.update(chatId, data);
    },
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
      queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.CONVERSATION(chatId) });
    },
  });

  const renameChat = useMutation({
    mutationFn: ({ id, title }) => {
      if (!id) throw new Error('ID do chat inválido');
      const sanitizedTitle = sanitizeTitle(title);
      if (!sanitizedTitle) throw new Error('Título inválido');
      return base44.entities.TitanosConversation.update(id, { title: sanitizedTitle });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
      queryClient.invalidateQueries({ queryKey: TITANOS_QUERY_KEYS.CONVERSATION(id) });
      toast.success('Chat renomeado!');
    },
    onError: (err) => {
      toast.error('Erro ao renomear: ' + (err.message || 'Erro desconhecido'));
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
      if (!conversationId) throw new Error('Conversa não selecionada');
      if (!modelId) throw new Error('Modelo não especificado');

      // Se já votou neste modelo, remove
      if (existingVote) {
        await base44.entities.ModelVote.delete(existingVote.id);
        return { action: 'removed' };
      }
      
      // Remove votos anteriores (um voto por conversa)
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
      console.error('[useVoteMutations] Error:', err);
      toast.error('Erro ao registrar voto');
    },
  });

  return { vote };
}