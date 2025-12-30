/**
 * Multi Chat - Página Principal
 * Compare respostas de múltiplos modelos de IA
 */

import React, { useMemo } from 'react';

// Components
import TitanosContent from '@/components/titanos/TitanosContent';

// Hooks
import { 
  useTitanosUser, 
  useApprovedModels, 
  useTitanosGroups,
  useTitanosConversations, 
  useTitanosConversation, 
  useTitanosMessages 
} from '@/components/titanos/hooks/useTitanosData';
import { useConversationMutations } from '@/components/titanos/hooks/useTitanosMutations';
import { useRegenerateResponse, useSendMessage } from '@/components/titanos/hooks/useSendMessage';
import { useTitanosState } from '@/components/titanos/hooks/useTitanosState';
import { useConversationHandlers, useDerivedData } from '@/components/titanos/hooks/useTitanosHandlers';

export default function TitanosRouter() {
  // Estado local centralizado
  const state = useTitanosState();
  
  const {
    input,
    activeConversationId,
    isNewModalOpen,
    isTypeSelectorOpen,
    isMultiScriptOpen,
    newConversationGroup,
    removeModelTarget,
    expandedModel,
    limit,
    setInput,
    setActiveConversationId,
    openTypeSelector,
    openNewModal,
    closeNewModal,
    closeTypeSelector,
    openMultiScript,
    closeMultiScript,
    openExpandedModel,
    closeExpandedModel,
    requestRemoveModel,
    cancelRemoveModel,
    loadMore,
    clearInput,
    restoreInput,
  } = state;

  // Data Hooks
  const { data: user } = useTitanosUser();
  const { data: approvedModels = [] } = useApprovedModels();
  const { data: groups = [] } = useTitanosGroups();
  const { data: conversations = [] } = useTitanosConversations(limit);
  const { data: activeConversation } = useTitanosConversation(activeConversationId);
  const { data: messages = [] } = useTitanosMessages(activeConversationId);
  
  // Mutations
  const { update: updateConversation, remove: deleteConversation } = useConversationMutations(activeConversationId);
  const { sendMessage, isLoading } = useSendMessage(activeConversationId, activeConversation, messages, groups);
  const { regenerate, regeneratingModel } = useRegenerateResponse(activeConversationId);

  // Derived state
  const hiddenModels = activeConversation?.hidden_models || [];
  const selectedModels = activeConversation?.selected_models || [];
  
  const { isAdmin, visibleModels } = useDerivedData({
    user,
    activeConversation,
    selectedModels,
    hiddenModels,
  });

  // Handlers
  const handlers = useConversationHandlers({
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
  });

  return (
    <TitanosContent
      // Data
      conversations={conversations}
      activeConversation={activeConversation}
      messages={messages}
      approvedModels={approvedModels}
      groups={groups}
      
      // State
      input={input}
      activeConversationId={activeConversationId}
      isNewModalOpen={isNewModalOpen}
      isTypeSelectorOpen={isTypeSelectorOpen}
      isMultiScriptOpen={isMultiScriptOpen}
      newConversationGroup={newConversationGroup}
      removeModelTarget={removeModelTarget}
      expandedModel={expandedModel}
      limit={limit}
      isLoading={isLoading}
      regeneratingModel={regeneratingModel}
      isAdmin={isAdmin}
      visibleModels={visibleModels}
      hiddenModels={hiddenModels}
      selectedModels={selectedModels}
      
      // Actions
      setInput={setInput}
      setActiveConversationId={setActiveConversationId}
      openTypeSelector={openTypeSelector}
      openNewModal={openNewModal}
      closeNewModal={closeNewModal}
      closeTypeSelector={closeTypeSelector}
      openMultiScript={openMultiScript}
      closeMultiScript={closeMultiScript}
      openExpandedModel={openExpandedModel}
      closeExpandedModel={closeExpandedModel}
      requestRemoveModel={requestRemoveModel}
      cancelRemoveModel={cancelRemoveModel}
      loadMore={loadMore}
      
      // Handlers
      getAlias={handlers.getAlias}
      getModelMessages={handlers.getModelMessages}
      handleHideModel={handlers.handleHideModel}
      handleShowModel={handlers.handleShowModel}
      handleRemoveModel={handlers.handleRemoveModel}
      handleSend={handlers.handleSend}
      handleRegenerate={handlers.handleRegenerate}
      handleModelsChange={handlers.handleModelsChange}
      handleDeleteConversation={handlers.handleDeleteConversation}
      handleConversationCreated={handlers.handleConversationCreated}
    />
  );
}