/**
 * Hooks para mutações do Multi Chat
 * Centraliza todas as operações de escrita
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Hook para mutações de conversa
 */
export function useConversationMutations(activeConversationId) {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: (data) => base44.entities.TitanosConversation.update(activeConversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titanos-conversation', activeConversationId] });
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id) => base44.entities.TitanosConversation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
    },
  });

  const create = useMutation({
    mutationFn: async (data) => {
      const conversation = await base44.entities.TitanosConversation.create(data);
      
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
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
      toast.success('Conversa criada com sucesso!');
    },
    onError: (err) => {
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
      if (id) {
        return base44.entities.TitanosChatGroup.update(id, data);
      }
      return base44.entities.TitanosChatGroup.create(data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['titanos-groups'] });
      toast.success(id ? 'Grupo atualizado!' : 'Grupo criado!');
    },
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      // Move conversas do grupo para "sem grupo"
      const conversations = await base44.entities.TitanosConversation.filter({ group_id: id });
      await Promise.all(
        conversations.map(c => base44.entities.TitanosConversation.update(c.id, { group_id: null }))
      );
      return base44.entities.TitanosChatGroup.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titanos-groups'] });
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
      toast.success('Grupo excluído!');
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
    mutationFn: ({ chatId, data }) => base44.entities.TitanosConversation.update(chatId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
    },
  });

  const renameChat = useMutation({
    mutationFn: ({ id, title }) => base44.entities.TitanosConversation.update(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titanos-conversations'] });
      toast.success('Chat renomeado!');
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
      // Se já votou neste modelo, remove
      if (existingVote) {
        await base44.entities.ModelVote.delete(existingVote.id);
        return { action: 'removed' };
      }
      
      // Remove votos anteriores
      if (allVotes?.length > 0) {
        await Promise.all(allVotes.map(v => base44.entities.ModelVote.delete(v.id)));
      }
      
      // Cria novo voto
      await base44.entities.ModelVote.create({
        conversation_id: conversationId,
        model_id: modelId,
        model_alias: modelAlias,
        vote_type: 'best',
        context,
      });
      
      return { action: 'voted', modelAlias };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['titanos-votes', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['modelVotes'] });
      
      if (result.action === 'voted') {
        toast.success(`Você votou em ${result.modelAlias} como melhor resposta!`);
      } else {
        toast.success('Voto removido');
      }
    },
    onError: () => {
      toast.error('Erro ao registrar voto');
    },
  });

  return { vote };
}