/**
 * Conteúdo principal do Multi Chat
 * Separado da página para melhor organização e testabilidade
 */

import React, { memo, useMemo } from 'react';
import { Sparkles } from 'lucide-react';

import PageHeader from "@/components/common/PageHeader";
import CanvasToggleButton from '@/components/canvas/CanvasToggleButton';

// Multi Chat Components
import ConversationSidebar from './ConversationSidebar';
import HiddenModelsBar from './HiddenModelsBar';
import EmptyConversation from './EmptyConversation';
import TitanosModals from './TitanosModals';
import TitanosChatArea from './TitanosChatArea';
import TitanosHeader from './TitanosHeader';
import TitanosInputArea from './TitanosInputArea';

/**
 * Componente principal do Multi Chat
 */
function TitanosContent({
  // Data
  conversations,
  activeConversation,
  messages,
  approvedModels,
  groups,
  
  // State
  input,
  activeConversationId,
  isNewModalOpen,
  isTypeSelectorOpen,
  isMultiScriptOpen,
  newConversationGroup,
  removeModelTarget,
  expandedModel,
  limit,
  isLoading,
  regeneratingModel,
  isAdmin,
  visibleModels,
  hiddenModels,
  selectedModels,
  
  // Actions
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
  
  // Handlers
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
}) {
  const hasMore = conversations.length >= limit;

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
          onNew={openTypeSelector}
          onNewInGroup={openNewModal}
          onDelete={handleDeleteConversation}
          onSelect={setActiveConversationId}
          onLoadMore={loadMore}
          hasMore={hasMore}
        />
      
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          {/* Conversation Header */}
          {activeConversation && (
            <TitanosHeader 
              conversation={activeConversation}
              messages={messages}
              selectedModels={selectedModels}
              onModelsChange={handleModelsChange}
            />
          )}

          {/* Hidden Models Bar */}
          {activeConversationId && hiddenModels.length > 0 && (
            <HiddenModelsBar 
              hiddenModels={hiddenModels} 
              onShow={handleShowModel} 
            />
          )}

          {/* Chat Area or Empty State */}
          {activeConversationId ? (
            <>
              <TitanosChatArea 
                visibleModels={visibleModels}
                messages={messages}
                isLoading={isLoading}
                regeneratingModel={regeneratingModel}
                getAlias={getAlias}
                getMessagesForModel={getModelMessages}
                onHide={handleHideModel}
                onRemove={requestRemoveModel}
                onRegenerate={handleRegenerate}
                onExpand={openExpandedModel}
                isAdmin={isAdmin}
                conversationId={activeConversationId}
              />

              <TitanosInputArea 
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                onSend={() => handleSend(input)}
              />
            </>
          ) : (
            <EmptyConversation onNewConversation={openTypeSelector} />
          )}
        </div>
      </div>

      {/* Modals */}
      <TitanosModals 
        isTypeSelectorOpen={isTypeSelectorOpen}
        closeTypeSelector={closeTypeSelector}
        openNewModal={() => openNewModal(null)}
        openMultiScript={openMultiScript}
        isNewModalOpen={isNewModalOpen}
        closeNewModal={closeNewModal}
        handleConversationCreated={handleConversationCreated}
        newConversationGroup={newConversationGroup}
        isMultiScriptOpen={isMultiScriptOpen}
        closeMultiScript={closeMultiScript}
        expandedModel={expandedModel}
        closeExpandedModel={closeExpandedModel}
        getAlias={getAlias}
        activeConversationId={activeConversationId}
        getModelMessages={getModelMessages}
        messages={messages}
        removeModelTarget={removeModelTarget}
        cancelRemoveModel={cancelRemoveModel}
        handleRemoveModel={handleRemoveModel}
      />
    </div>
  );
}

export default memo(TitanosContent);