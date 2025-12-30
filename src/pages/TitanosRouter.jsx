import React, { useState, useMemo, useCallback } from 'react';
import { Send, Settings, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
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

import PageHeader from "@/components/common/PageHeader";
import CanvasToggleButton from '@/components/canvas/CanvasToggleButton';

// Multi Chat Components
import ConversationSidebar from '@/components/titanos/ConversationSidebar';
import ChatColumn from '@/components/titanos/ChatColumn';
import ModelSelector from '@/components/titanos/ModelSelector';
import NewConversationModal from '@/components/titanos/NewConversationModal';
import ConversationTypeSelector from '@/components/titanos/ConversationTypeSelector';
import MultiScriptWizardModal from '@/components/titanos/multiscript/MultiScriptWizardModal';
import HiddenModelsBar from '@/components/titanos/HiddenModelsBar';
import ConversationMetricsButton from '@/components/titanos/ConversationMetricsButton';
import SingleModelChatModal from '@/components/titanos/SingleModelChatModal';
import EmptyConversation from '@/components/titanos/EmptyConversation';
import NoModelsState from '@/components/titanos/NoModelsState';

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
import { useQueryClient } from '@tanstack/react-query';

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

  const queryClient = useQueryClient();

  // Data Hooks
  const { data: user } = useTitanosUser();
  const { data: approvedModels = [] } = useApprovedModels();
  const { data: groups = [] } = useTitanosGroups();
  const { data: conversations = [] } = useTitanosConversations(limit);
  const { data: activeConversation } = useTitanosConversation(activeConversationId);
  
  // Messages query & send hook
  const { data: messages = [] } = useTitanosMessages(activeConversationId);
  const { sendMessage, isLoading } = useSendMessage(activeConversationId, activeConversation, messages, groups);
  const { regenerate, regeneratingModel } = useRegenerateResponse(activeConversationId);

  // Mutations
  const { update: updateConversation, remove: deleteConversation } = useConversationMutations(activeConversationId);

  // Derived state
  const isAdmin = user?.role === 'admin';
  const hiddenModels = activeConversation?.hidden_models || [];
  const selectedModels = activeConversation?.selected_models || [];
  const visibleModels = useMemo(
    () => selectedModels.filter(m => !hiddenModels.includes(m)), 
    [selectedModels, hiddenModels]
  );

  // Handlers
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

  const getAlias = useCallback((modelId) => getModelAlias(modelId, approvedModels), [approvedModels]);

  return (
    <div className="space-y-6 -m-6 md:-m-12">
      <div className="px-6 md:px-12 pt-6 md:pt-10">
        <PageHeader
          title="Multi Chat"
          subtitle="Compare respostas de múltiplos modelos de IA"
          icon={Sparkles}
          actions={<CanvasToggleButton />}
        />
      </div>

      <div className="flex h-[calc(100vh-180px)] bg-white rounded-t-2xl border border-slate-200 overflow-hidden mx-6 md:mx-12 shadow-sm">
        <ConversationSidebar 
          conversations={conversations}
          activeId={activeConversationId}
          onNew={handleNewConversation}
          onNewInGroup={handleNewConversationInGroup}
          onDelete={(id) => {
            deleteConversation.mutate(id);
            if (activeConversationId === id) setActiveConversationId(null);
          }}
          onSelect={setActiveConversationId}
          onLoadMore={() => setLimit(prev => prev + 50)}
          hasMore={conversations.length >= limit}
        />
      
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          {/* Header */}
          {activeConversation && (
            <ConversationHeader 
              conversation={activeConversation}
              messages={messages}
              selectedModels={selectedModels}
              onModelsChange={(models) => updateConversation.mutate({ selected_models: models })}
            />
          )}

          {/* Hidden Models Bar */}
          {activeConversationId && (
            <HiddenModelsBar hiddenModels={hiddenModels} onShow={handleShowModel} />
          )}

          {/* Main Content */}
          {activeConversationId ? (
            <>
              <ChatArea 
                visibleModels={visibleModels}
                messages={messages}
                isLoading={isLoading}
                regeneratingModel={regeneratingModel}
                getAlias={getAlias}
                getMessagesForModel={(modelId) => getMessagesForModel(messages, modelId)}
                onHide={handleHideModel}
                onRemove={setRemoveModelTarget}
                onRegenerate={handleRegenerate}
                onExpand={setExpandedModel}
                isAdmin={isAdmin}
                conversationId={activeConversationId}
              />

              {/* Input */}
              <ChatInputArea 
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                onSend={handleSend}
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
          messages={getMessagesForModel(messages, expandedModel)}
          allMessages={messages}
        />
      )}

      {/* Remove Model Confirmation */}
      <AlertDialog open={!!removeModelTarget} onOpenChange={(open) => !open && setRemoveModelTarget(null)}>
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
            <AlertDialogAction onClick={handleRemoveModel} className="bg-red-600 hover:bg-red-700">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Sub-components
const ConversationHeader = React.memo(({ conversation, messages, selectedModels, onModelsChange }) => (
  <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
    <div className="flex items-center gap-3">
      <h2 className="font-semibold text-slate-800 truncate max-w-[300px]">
        {conversation.title}
      </h2>
    </div>
    <div className="flex items-center gap-2">
      {messages.length > 0 && (
        <ConversationMetricsButton messages={messages} selectedModels={selectedModels} />
      )}
      <div className="h-4 w-px bg-slate-200 mx-1" />
      <ModelSelector selectedModels={selectedModels} onSelectionChange={onModelsChange} />
    </div>
  </div>
));
ConversationHeader.displayName = 'ConversationHeader';

const ChatArea = React.memo(({ 
  visibleModels, messages, isLoading, regeneratingModel, getAlias, getMessagesForModel,
  onHide, onRemove, onRegenerate, onExpand, isAdmin, conversationId 
}) => (
  <div className="flex-1 relative min-h-0 bg-slate-50/30">
    <div className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200">
      <div className="h-full flex p-0 divide-x divide-slate-200/50 min-w-full">
        {visibleModels.length === 0 ? (
          <NoModelsState />
        ) : (
          visibleModels.map(modelId => (
            <ChatColumn 
              key={modelId}
              modelId={modelId}
              modelName={getAlias(modelId)}
              messages={getMessagesForModel(modelId)}
              isLoading={isLoading || regeneratingModel === modelId}
              onHide={() => onHide(modelId)}
              onRemove={() => onRemove(modelId)}
              onRegenerate={() => onRegenerate(modelId)}
              onExpand={() => onExpand(modelId)}
              isAdmin={isAdmin}
              conversationId={conversationId}
            />
          ))
        )}
      </div>
    </div>
  </div>
));
ChatArea.displayName = 'ChatArea';

const ChatInputArea = React.memo(({ input, setInput, isLoading, onSend }) => (
  <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md">
    <div className="max-w-4xl mx-auto relative group">
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:shadow-md focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-50/50 transition-all duration-300">
        <Textarea 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem para todos os modelos..."
          className="min-h-[70px] max-h-[220px] pr-14 py-4 pl-4 w-full resize-none bg-transparent border-0 focus:ring-0 text-base placeholder:text-slate-400"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <div className="absolute bottom-2 right-2">
          <Button 
            onClick={onSend}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-9 w-9 rounded-xl bg-pink-600 hover:bg-pink-700 text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
    <div className="text-center mt-3">
      <p className="text-[10px] text-slate-400 font-medium">
        Pressione Enter para enviar • Shift + Enter para nova linha
      </p>
    </div>
  </div>
));
ChatInputArea.displayName = 'ChatInputArea';