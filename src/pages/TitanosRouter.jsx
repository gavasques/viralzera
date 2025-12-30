/**
 * Multi Chat - Página Principal
 * Refatorada para melhor organização e performance
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from "@/components/common/PageHeader";
import CanvasToggleButton from '@/components/canvas/CanvasToggleButton';

// Multi Chat Components
import ConversationSidebar from '@/components/titanos/ConversationSidebar';
import NewConversationModal from '@/components/titanos/NewConversationModal';
import ConversationTypeSelector from '@/components/titanos/ConversationTypeSelector';
import MultiScriptWizardModal from '@/components/titanos/multiscript/MultiScriptWizardModal';
import HiddenModelsBar from '@/components/titanos/HiddenModelsBar';
import SingleModelChatModal from '@/components/titanos/SingleModelChatModal';
import EmptyConversation from '@/components/titanos/EmptyConversation';

// Sub-componentes extraídos
import ChatInputArea from '@/components/titanos/components/ChatInputArea';
import ConversationHeader from '@/components/titanos/components/ConversationHeader';
import ChatArea from '@/components/titanos/components/ChatArea';
import RemoveModelDialog from '@/components/titanos/components/RemoveModelDialog';

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

// Utils
import { getMessagesForModel, getModelAlias } from '@/components/titanos/utils';
import { DEFAULT_CONVERSATION_LIMIT } from '@/components/titanos/constants';

export default function TitanosRouter() {
  // UI State
  const [input, setInput] = useState('');
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
  const [isMultiScriptOpen, setIsMultiScriptOpen] = useState(false);
  const [newConversationGroup, setNewConversationGroup] = useState(null);
  const [removeModelTarget, setRemoveModelTarget] = useState(null);
  const [expandedModel, setExpandedModel] = useState(null);
  const [limit, setLimit] = useState(DEFAULT_CONVERSATION_LIMIT);

  // Data Hooks
  const { data: user } = useTitanosUser();
  const { data: approvedModels = [] } = useApprovedModels();
  const { data: groups = [] } = useTitanosGroups();
  const { data: conversations = [] } = useTitanosConversations(limit);
  const { data: activeConversation } = useTitanosConversation(activeConversationId);
  const { data: messages = [] } = useTitanosMessages(activeConversationId);
  
  // Message hooks
  const { sendMessage, isLoading, cancel } = useSendMessage(
    activeConversationId, 
    activeConversation, 
    messages, 
    groups
  );
  const { regenerate, regeneratingModel } = useRegenerateResponse(activeConversationId);

  // Mutations
  const { update: updateConversation, remove: deleteConversation } = useConversationMutations(activeConversationId);

  // Derived state (memoized)
  const isAdmin = user?.role === 'admin';
  const hiddenModels = activeConversation?.hidden_models || [];
  const selectedModels = activeConversation?.selected_models || [];
  const visibleModels = useMemo(
    () => selectedModels.filter(m => !hiddenModels.includes(m)), 
    [selectedModels, hiddenModels]
  );

  // Cleanup ao desmontar ou trocar de conversa
  useEffect(() => {
    return () => cancel?.();
  }, [activeConversationId, cancel]);

  // Handlers (memoized)
  const handleNewConversation = useCallback(() => {
    setNewConversationGroup(null);
    setIsTypeSelectorOpen(true);
  }, []);

  const handleNewConversationInGroup = useCallback((group) => {
    setNewConversationGroup(group);
    setIsNewModalOpen(true);
  }, []);

  const handleConversationCreated = useCallback((newConv) => {
    setActiveConversationId(newConv.id);
  }, []);

  const handleHideModel = useCallback((modelId) => {
    updateConversation.mutate({ hidden_models: [...hiddenModels, modelId] });
    toast.success('Modelo ocultado');
  }, [updateConversation, hiddenModels]);

  const handleShowModel = useCallback((modelId) => {
    updateConversation.mutate({ hidden_models: hiddenModels.filter(m => m !== modelId) });
    toast.success('Modelo reexibido');
  }, [updateConversation, hiddenModels]);

  const handleRemoveModel = useCallback(() => {
    if (!removeModelTarget) return;
    
    updateConversation.mutate({ 
      selected_models: selectedModels.filter(m => m !== removeModelTarget),
      removed_models: [...(activeConversation?.removed_models || []), removeModelTarget],
      hidden_models: hiddenModels.filter(m => m !== removeModelTarget),
    });
    
    toast.success('Modelo removido do chat');
    setRemoveModelTarget(null);
  }, [removeModelTarget, selectedModels, activeConversation, hiddenModels, updateConversation]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeConversationId || selectedModels.length === 0) return;
    
    const currentInput = input;
    setInput('');
    
    const result = await sendMessage(currentInput, selectedModels);
    
    if (!result.success) {
      setInput(currentInput);
    }
  }, [input, activeConversationId, selectedModels, sendMessage]);

  const handleRegenerate = useCallback((modelId) => {
    regenerate(modelId, messages);
  }, [regenerate, messages]);

  const handleDeleteConversation = useCallback((id) => {
    deleteConversation.mutate(id);
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  }, [deleteConversation, activeConversationId]);

  const handleModelsChange = useCallback((models) => {
    updateConversation.mutate({ selected_models: models });
  }, [updateConversation]);

  const getAlias = useCallback((modelId) => getModelAlias(modelId, approvedModels), [approvedModels]);
  
  const getMessagesForModelCallback = useCallback(
    (modelId) => getMessagesForModel(messages, modelId), 
    [messages]
  );

  return (
    <div className="space-y-6 -m-6 md:-m-12">
      {/* Header */}
      <div className="px-6 md:px-12 pt-6 md:pt-10">
        <PageHeader
          title="Multi Chat"
          subtitle="Compare respostas de múltiplos modelos de IA"
          icon={Sparkles}
          actions={<CanvasToggleButton />}
        />
      </div>

      {/* Main Container */}
      <div className="flex h-[calc(100vh-180px)] bg-white rounded-t-2xl border border-slate-200 overflow-hidden mx-6 md:mx-12 shadow-sm">
        {/* Sidebar */}
        <ConversationSidebar 
          conversations={conversations}
          activeId={activeConversationId}
          onNew={handleNewConversation}
          onNewInGroup={handleNewConversationInGroup}
          onDelete={handleDeleteConversation}
          onSelect={setActiveConversationId}
          onLoadMore={() => setLimit(prev => prev + 50)}
          hasMore={conversations.length >= limit}
        />
      
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          {activeConversation && (
            <ConversationHeader 
              conversation={activeConversation}
              messages={messages}
              selectedModels={selectedModels}
              onModelsChange={handleModelsChange}
            />
          )}

          {activeConversationId && (
            <HiddenModelsBar hiddenModels={hiddenModels} onShow={handleShowModel} />
          )}

          {activeConversationId ? (
            <>
              <ChatArea 
                visibleModels={visibleModels}
                messages={messages}
                isLoading={isLoading}
                regeneratingModel={regeneratingModel}
                getAlias={getAlias}
                getMessagesForModel={getMessagesForModelCallback}
                onHide={handleHideModel}
                onRemove={setRemoveModelTarget}
                onRegenerate={handleRegenerate}
                onExpand={setExpandedModel}
                isAdmin={isAdmin}
                conversationId={activeConversationId}
              />

              <ChatInputArea 
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                onSend={handleSend}
                disabled={selectedModels.length === 0}
              />
            </>
          ) : (
            <EmptyConversation onNewConversation={handleNewConversation} />
          )}
        </div>
      </div>

      {/* Modals */}
      <ConversationTypeSelector
        open={isTypeSelectorOpen}
        onOpenChange={setIsTypeSelectorOpen}
        onSelectNormal={() => setIsNewModalOpen(true)}
        onSelectMultiScript={() => setIsMultiScriptOpen(true)}
      />

      <NewConversationModal 
        open={isNewModalOpen} 
        onOpenChange={setIsNewModalOpen}
        onCreated={handleConversationCreated}
        defaultGroup={newConversationGroup}
      />

      <MultiScriptWizardModal
        open={isMultiScriptOpen}
        onOpenChange={setIsMultiScriptOpen}
        onCreate={handleConversationCreated}
      />

      {expandedModel && (
        <SingleModelChatModal
          open={!!expandedModel}
          onOpenChange={(open) => !open && setExpandedModel(null)}
          modelId={expandedModel}
          modelName={getAlias(expandedModel)}
          conversationId={activeConversationId}
          messages={getMessagesForModelCallback(expandedModel)}
          allMessages={messages}
        />
      )}

      <RemoveModelDialog
        modelId={removeModelTarget}
        modelName={removeModelTarget ? getAlias(removeModelTarget) : ''}
        onConfirm={handleRemoveModel}
        onCancel={() => setRemoveModelTarget(null)}
      />
    </div>
  );
}