/**
 * Hook para handlers do Multi Chat
 * Centraliza toda a lógica de eventos e ações
 */

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { getMessagesForModel, getModelAlias, getOpenRouterId } from '../utils';
import { sanitizeInput } from '../utils/sanitize';

/**
 * Hook para handlers de conversa
 */
export function useConversationHandlers({
  activeConversationId,
  activeConversation,
  messages,
  selectedModels,
  hiddenModels,
  approvedModels,
  groups,
  updateConversation,
  deleteConversation,
  sendMessage,
  regenerate,
  setActiveConversationId,
  clearInput,
  restoreInput,
  cancelRemoveModel,
  removeModelTarget,
}) {
  // Obter alias do modelo
  const getAlias = useCallback(
    (modelId) => getModelAlias(modelId, approvedModels),
    [approvedModels]
  );

  // Obter mensagens filtradas para um modelo
  // Recebe o recordId (ID único) - agora as mensagens são salvas com recordId
  const getModelMessages = useCallback(
    (recordId) => {
      return getMessagesForModel(messages, recordId);
    },
    [messages]
  );

  // Handler: Ocultar modelo
  const handleHideModel = useCallback((modelId) => {
    if (!activeConversationId) return;
    
    updateConversation.mutate({ 
      hidden_models: [...hiddenModels, modelId] 
    });
    toast.success('Modelo ocultado');
  }, [updateConversation, hiddenModels, activeConversationId]);

  // Handler: Mostrar modelo
  const handleShowModel = useCallback((modelId) => {
    if (!activeConversationId) return;
    
    updateConversation.mutate({ 
      hidden_models: hiddenModels.filter(m => m !== modelId) 
    });
    toast.success('Modelo reexibido');
  }, [updateConversation, hiddenModels, activeConversationId]);

  // Handler: Remover modelo (confirmado)
  const handleRemoveModel = useCallback(() => {
    if (!removeModelTarget || !activeConversation) return;
    
    updateConversation.mutate({ 
      selected_models: selectedModels.filter(m => m !== removeModelTarget),
      removed_models: [...(activeConversation.removed_models || []), removeModelTarget],
      hidden_models: hiddenModels.filter(m => m !== removeModelTarget),
    });
    
    toast.success('Modelo removido do chat');
    cancelRemoveModel();
  }, [removeModelTarget, selectedModels, activeConversation, hiddenModels, updateConversation, cancelRemoveModel]);

  // Handler: Enviar mensagem
  const handleSend = useCallback(async (inputValue) => {
    if (!activeConversationId || selectedModels.length === 0) {
      return { success: false };
    }

    // Sanitiza o input
    const sanitizedInput = sanitizeInput(inputValue);
    
    if (!sanitizedInput) {
      toast.warning('Digite uma mensagem válida');
      return { success: false };
    }
    
    clearInput();
    
    // Passa os recordIds e os approvedModels para o sendMessage
    // O sendMessage vai converter para openRouterIds internamente e salvar com recordId
    const result = await sendMessage(sanitizedInput, selectedModels, approvedModels);
    
    if (!result.success) {
      restoreInput(inputValue);
    }
    
    return result;
  }, [activeConversationId, selectedModels, approvedModels, sendMessage, clearInput, restoreInput]);

  // Handler: Regenerar resposta
  // Recebe o recordId - regenerate precisa do approvedModels para converter
  const handleRegenerate = useCallback((recordId) => {
    regenerate(recordId, messages, approvedModels);
  }, [regenerate, messages, approvedModels]);

  // Handler: Atualizar modelos selecionados
  const handleModelsChange = useCallback((models) => {
    if (!activeConversationId) return;
    updateConversation.mutate({ selected_models: models });
  }, [updateConversation, activeConversationId]);

  // Handler: Deletar conversa
  const handleDeleteConversation = useCallback((id) => {
    deleteConversation.mutate(id);
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [deleteConversation, activeConversationId, setActiveConversationId]);

  // Handler: Conversa criada
  const handleConversationCreated = useCallback((newConv) => {
    setActiveConversationId(newConv.id);
  }, [setActiveConversationId]);

  return {
    getAlias,
    getModelMessages,
    handleHideModel,
    handleShowModel,
    handleRemoveModel,
    handleSend,
    handleRegenerate,
    handleModelsChange,
    handleDeleteConversation,
    handleConversationCreated,
  };
}

/**
 * Hook para dados derivados do Multi Chat
 */
export function useDerivedData({
  user,
  activeConversation,
  selectedModels,
  hiddenModels,
}) {
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);
  
  const visibleModels = useMemo(
    () => selectedModels.filter(m => !hiddenModels.includes(m)),
    [selectedModels, hiddenModels]
  );

  return {
    isAdmin,
    visibleModels,
  };
}