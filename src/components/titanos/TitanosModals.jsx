/**
 * Modais do Multi Chat
 * Centraliza todos os modais em um componente
 */

import React, { memo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import NewConversationModal from './NewConversationModal';
import ConversationTypeSelector from './ConversationTypeSelector';
import MultiScriptWizardModal from './multiscript/MultiScriptWizardModal';
import SingleModelChatModal from './SingleModelChatModal';

function TitanosModals({
  // Type Selector
  isTypeSelectorOpen,
  closeTypeSelector,
  openNewModal,
  openMultiScript,
  
  // New Conversation Modal
  isNewModalOpen,
  closeNewModal,
  handleConversationCreated,
  newConversationGroup,
  approvedModels,
  
  // Multi Script Modal
  isMultiScriptOpen,
  closeMultiScript,
  
  // Expanded Model Modal
  expandedModel,
  closeExpandedModel,
  getAlias,
  activeConversationId,
  getModelMessages,
  messages,
  
  // Remove Model Dialog
  removeModelTarget,
  cancelRemoveModel,
  handleRemoveModel,
}) {
  return (
    <>
      {/* Type Selector */}
      <ConversationTypeSelector
        open={isTypeSelectorOpen}
        onOpenChange={(open) => !open && closeTypeSelector()}
        onSelectNormal={openNewModal}
        onSelectMultiScript={openMultiScript}
      />

      {/* New Conversation Modal */}
      <NewConversationModal 
        open={isNewModalOpen} 
        onOpenChange={(open) => !open && closeNewModal()}
        onCreated={handleConversationCreated}
        defaultGroup={newConversationGroup}
        approvedModels={approvedModels}
      />

      {/* Multi Script Wizard */}
      <MultiScriptWizardModal
        open={isMultiScriptOpen}
        onOpenChange={(open) => !open && closeMultiScript()}
        onCreate={handleConversationCreated}
      />

      {/* Single Model Chat */}
      {expandedModel && (
        <SingleModelChatModal
          open={!!expandedModel}
          onOpenChange={(open) => !open && closeExpandedModel()}
          modelId={expandedModel}
          modelName={getAlias(expandedModel)}
          conversationId={activeConversationId}
          messages={getModelMessages(expandedModel)}
          allMessages={messages}
        />
      )}

      {/* Remove Model Confirmation */}
      <AlertDialog 
        open={!!removeModelTarget} 
        onOpenChange={(open) => !open && cancelRemoveModel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{removeModelTarget ? getAlias(removeModelTarget) : ''}" deste chat? 
              O histórico de métricas será preservado, mas o modelo não receberá mais mensagens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveModel} 
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default memo(TitanosModals);