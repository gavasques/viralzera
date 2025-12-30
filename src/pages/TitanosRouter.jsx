import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Send, Settings, Plus, Sparkles } from 'lucide-react';
import { QUERY_KEYS } from '@/components/constants/queryKeys';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import PageHeader from "@/components/common/PageHeader";
import ConversationSidebar from '@/components/titanos/ConversationSidebar';
import ChatColumn from '@/components/titanos/ChatColumn';
import ModelSelector from '@/components/titanos/ModelSelector';
import NewConversationModal from '@/components/titanos/NewConversationModal';
import ConversationTypeSelector from '@/components/titanos/ConversationTypeSelector';
import MultiScriptWizardModal from '@/components/titanos/multiscript/MultiScriptWizardModal';
import CanvasToggleButton from '@/components/canvas/CanvasToggleButton';
import HiddenModelsBar from '@/components/titanos/HiddenModelsBar';
import ConversationMetricsButton from '@/components/titanos/ConversationMetricsButton';
import SingleModelChatModal from '@/components/titanos/SingleModelChatModal';
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

export default function TitanosRouter() {
    const queryClient = useQueryClient();
    const [input, setInput] = useState('');
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
    const [isMultiScriptOpen, setIsMultiScriptOpen] = useState(false);
    const [newConversationGroup, setNewConversationGroup] = useState(null);
    const [removeModelTarget, setRemoveModelTarget] = useState(null);
    const [expandedModel, setExpandedModel] = useState(null);
    const [regeneratingModel, setRegeneratingModel] = useState(null);
    const [limit, setLimit] = useState(50);

    // Fetch current user
    const { data: user } = useQuery({
        queryKey: QUERY_KEYS.USER,
        queryFn: () => base44.auth.me(),
        staleTime: 300000
    });

    const isAdmin = user?.role === 'admin';

    // Fetch approved models for alias lookup
    const { data: approvedModels = [] } = useQuery({
        queryKey: [QUERY_KEYS.APPROVED_MODELS],
        queryFn: () => base44.entities.ApprovedModel.list('order', 100),
        staleTime: 60000
    });

    // Helper to get model alias
    const getModelAlias = (modelId) => {
        const approved = approvedModels.find(m => m.model_id === modelId);
        return approved?.alias || modelId.split('/')[1] || modelId;
    };

    // Fetch Groups
    const { data: groups = [] } = useQuery({
        queryKey: ['titanosChatGroups'],
        queryFn: () => base44.entities.TitanosChatGroup.list('order', 50),
        staleTime: 1000 * 60 * 5
    });

    // Fetch Conversations
    const { data: conversations = [] } = useQuery({
        queryKey: ['titanosConversations', limit],
        queryFn: () => base44.entities.TitanosConversation.list('-created_date', limit),
        placeholderData: keepPreviousData,
        initialData: []
    });

    // Fetch Active Conversation
    const { data: activeConversation } = useQuery({
        queryKey: ['titanosConversation', activeConversationId],
        queryFn: () => base44.entities.TitanosConversation.get(activeConversationId),
        enabled: !!activeConversationId
    });

    // Fetch Messages for Active Conversation
    const { data: messages = [] } = useQuery({
        queryKey: ['titanosMessages', activeConversationId],
        queryFn: async () => {
             const msgs = await base44.entities.TitanosMessage.filter({ conversation_id: activeConversationId });
             return msgs;
        },
        enabled: !!activeConversationId,
        refetchInterval: isLoading ? 1000 : false
    });

    // Derived state
    const hiddenModels = activeConversation?.hidden_models || [];
    const selectedModels = activeConversation?.selected_models || [];
    const visibleModels = useMemo(() => 
        selectedModels.filter(m => !hiddenModels.includes(m)), 
        [selectedModels, hiddenModels]
    );

    const handleNewConversation = () => {
        setNewConversationGroup(null);
        setIsTypeSelectorOpen(true);
    };

    const handleNewConversationInGroup = (group) => {
        setNewConversationGroup(group);
        // For groups, go directly to normal conversation flow
        setIsNewModalOpen(true);
    };

    const handleSelectNormalConversation = () => {
        setIsNewModalOpen(true);
    };

    const handleSelectMultiScript = () => {
        setIsMultiScriptOpen(true);
    };

    const handleConversationCreated = (newConv) => {
        setActiveConversationId(newConv.id);
    };

    const updateConversationMutation = useMutation({
        mutationFn: async (data) => {
            return await base44.entities.TitanosConversation.update(activeConversationId, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['titanosConversation', activeConversationId] });
            queryClient.invalidateQueries({ queryKey: ['titanosConversations'] });
        }
    });

    const deleteConversationMutation = useMutation({
        mutationFn: (id) => base44.entities.TitanosConversation.delete(id),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['titanosConversations'] });
             if (activeConversationId) setActiveConversationId(null);
        }
    });

    // Hide/Show Model
    const handleHideModel = (modelId) => {
        const newHidden = [...hiddenModels, modelId];
        updateConversationMutation.mutate({ hidden_models: newHidden });
        toast.success('Modelo ocultado');
    };

    const handleShowModel = (modelId) => {
        const newHidden = hiddenModels.filter(m => m !== modelId);
        updateConversationMutation.mutate({ hidden_models: newHidden });
        toast.success('Modelo reexibido');
    };

    // Remove Model
    const handleRemoveModel = () => {
        if (!removeModelTarget) return;
        
        const newSelected = selectedModels.filter(m => m !== removeModelTarget);
        const newRemoved = [...(activeConversation?.removed_models || []), removeModelTarget];
        const newHidden = hiddenModels.filter(m => m !== removeModelTarget);
        
        updateConversationMutation.mutate({ 
            selected_models: newSelected,
            removed_models: newRemoved,
            hidden_models: newHidden
        });
        
        toast.success('Modelo removido do chat');
        setRemoveModelTarget(null);
    };

    const handleSend = async () => {
        if (!input.trim() || !activeConversationId) return;
        
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // Get group system prompt if conversation belongs to a group
            let effectiveHistory = messages.filter(m => m.model_id === null || selectedModels.includes(m.model_id));
            
            // Check if conversation has a group with master prompt
            if (activeConversation?.group_id) {
                const group = groups.find(g => g.id === activeConversation.group_id);
                if (group?.default_system_prompt) {
                    // Check if conversation has its own system prompt
                    const hasOwnSystemPrompt = messages.some(m => m.role === 'system');
                    if (!hasOwnSystemPrompt) {
                        // Prepend group's master prompt to history
                        effectiveHistory = [
                            { role: 'system', content: group.default_system_prompt },
                            ...effectiveHistory.filter(m => m.role !== 'system')
                        ];
                    }
                }
            }

            const res = await base44.functions.invoke('titanosChatSimple', {
                message: currentInput,
                conversationId: activeConversationId,
                selectedModels: selectedModels,
                history: effectiveHistory,
                enableReasoning: activeConversation?.enable_reasoning || false,
                reasoningEffort: activeConversation?.reasoning_effort || 'high',
                enableWebSearch: activeConversation?.enable_web_search || false
            });

            if (res.data?.error) {
                toast.error(`Erro: ${res.data.error}`);
            } else {
                queryClient.invalidateQueries({ queryKey: ['titanosMessages', activeConversationId] });
                
                // Update conversation metrics
                const allMsgs = await base44.entities.TitanosMessage.filter({ conversation_id: activeConversationId });
                let totalTokens = 0;
                let totalCost = 0;
                
                allMsgs.forEach(msg => {
                    if (msg.role === 'assistant' && msg.metrics?.usage) {
                        const usage = msg.metrics.usage;
                        totalTokens += (usage.total_tokens || (usage.prompt_tokens || 0) + (usage.completion_tokens || 0) || 0);
                        const promptTokens = usage.prompt_tokens || 0;
                        const completionTokens = usage.completion_tokens || 0;
                        totalCost += (promptTokens * 0.000001) + (completionTokens * 0.000002);
                    }
                });

                await base44.entities.TitanosConversation.update(activeConversationId, {
                    total_tokens: totalTokens,
                    total_cost: totalCost
                });
                
                queryClient.invalidateQueries({ queryKey: ['titanosConversations'] });
                queryClient.invalidateQueries({ queryKey: ['titanosConversation', activeConversationId] });
            }

        } catch (err) {
            toast.error("Falha ao enviar mensagem");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const getMessagesForModel = (modelId) => {
        return messages.filter(m => m.role === 'user' || m.role === 'system' || m.model_id === modelId).sort((a,b) => new Date(a.created_date) - new Date(b.created_date));
    };

    // Regenerate response for a specific model
    const handleRegenerate = async (modelId) => {
        // Find the first user message to regenerate from
        const userMessages = messages.filter(m => m.role === 'user' && !m.model_id);
        if (userMessages.length === 0) {
            toast.error('Nenhuma mensagem do usuário encontrada');
            return;
        }

        const firstUserMessage = userMessages[0];
        const history = messages
            .filter(m => m.role === 'system')
            .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

        setRegeneratingModel(modelId);

        try {
            const res = await base44.functions.invoke('titanosChatSingleModel', {
                message: firstUserMessage.content,
                conversationId: activeConversationId,
                modelId,
                history,
                saveUserMessage: false
            });

            if (res.data?.error) {
                toast.error(`Erro: ${res.data.error}`);
            } else {
                toast.success('Resposta regenerada!');
                queryClient.invalidateQueries({ queryKey: ['titanosMessages', activeConversationId] });
            }
        } catch (err) {
            toast.error('Falha ao regenerar');
            console.error(err);
        } finally {
            setRegeneratingModel(null);
        }
    };

    const handleExpandModel = (modelId) => {
        setExpandedModel(modelId);
    };

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
                    onDelete={(id) => deleteConversationMutation.mutate(id)}
                    onSelect={setActiveConversationId}
                    onLoadMore={() => setLimit(prev => prev + 50)}
                    hasMore={conversations.length >= limit}
                />
            
                <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
                    {/* Header */}
                    {activeConversation && (
                        <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="font-semibold text-slate-800 truncate max-w-[300px]">
                                    {activeConversation.title}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {messages.length > 0 && (
                                    <ConversationMetricsButton 
                                        messages={messages} 
                                        selectedModels={selectedModels}
                                    />
                                )}
                                <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                <ModelSelector 
                                    selectedModels={selectedModels}
                                    onSelectionChange={(models) => updateConversationMutation.mutate({ selected_models: models })}
                                />
                            </div>
                        </div>
                    )}

                {/* Hidden Models Bar */}
                {activeConversationId && (
                    <HiddenModelsBar 
                        hiddenModels={hiddenModels}
                        onShow={handleShowModel}
                    />
                )}

                {/* Main Content Area */}
                {activeConversationId ? (
                    <>
                        <div className="flex-1 relative min-h-0 bg-slate-50/30">
                             <div className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                 <div className="h-full flex p-0 divide-x divide-slate-200/50 min-w-full">
                                    {visibleModels.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center flex-col text-slate-400 w-full">
                                            <Settings className="w-12 h-12 mb-4 opacity-10" />
                                            <p>Selecione pelo menos um modelo para começar.</p>
                                        </div>
                                    ) : (
                                        visibleModels.map(modelId => (
                                            <ChatColumn 
                                                key={modelId}
                                                modelId={modelId}
                                                modelName={getModelAlias(modelId)}
                                                messages={getMessagesForModel(modelId)}
                                                isLoading={isLoading || regeneratingModel === modelId}
                                                onHide={() => handleHideModel(modelId)}
                                                onRemove={() => setRemoveModelTarget(modelId)}
                                                onRegenerate={() => handleRegenerate(modelId)}
                                                onExpand={() => handleExpandModel(modelId)}
                                                isAdmin={isAdmin}
                                                conversationId={activeConversationId}
                                            />
                                        ))
                                    )}
                                 </div>
                             </div>
                        </div>

                        {/* Input Area */}
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
                                                handleSend();
                                            }
                                        }}
                                    />
                                    <div className="absolute bottom-2 right-2">
                                        <Button 
                                            onClick={handleSend}
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
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
                        <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-pink-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhuma conversa selecionada</h3>
                        <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
                            Selecione uma conversa existente ou crie uma nova para começar a comparar modelos.
                        </p>
                        <Button onClick={handleNewConversation} className="bg-pink-600 hover:bg-pink-700">
                            <Plus className="w-4 h-4 mr-2" /> Nova Conversa
                        </Button>
                    </div>
                )}
                </div>
            </div>

            {/* Type Selector Modal */}
            <ConversationTypeSelector
                open={isTypeSelectorOpen}
                onOpenChange={setIsTypeSelectorOpen}
                onSelectNormal={handleSelectNormalConversation}
                onSelectMultiScript={handleSelectMultiScript}
            />

            {/* Normal Conversation Modal */}
            <NewConversationModal 
                open={isNewModalOpen} 
                onOpenChange={setIsNewModalOpen}
                onCreated={handleConversationCreated}
                defaultGroup={newConversationGroup}
            />

            {/* Multi Script Wizard Modal */}
            <MultiScriptWizardModal
                open={isMultiScriptOpen}
                onOpenChange={setIsMultiScriptOpen}
                onCreate={handleConversationCreated}
            />

            {/* Single Model Chat Modal */}
            {expandedModel && (
                <SingleModelChatModal
                    open={!!expandedModel}
                    onOpenChange={(open) => !open && setExpandedModel(null)}
                    modelId={expandedModel}
                    modelName={getModelAlias(expandedModel)}
                    conversationId={activeConversationId}
                    messages={getMessagesForModel(expandedModel)}
                    allMessages={messages}
                />
            )}

            {/* Remove Model Confirmation */}
            <AlertDialog open={!!removeModelTarget} onOpenChange={(open) => !open && setRemoveModelTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Modelo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover "{removeModelTarget ? getModelAlias(removeModelTarget) : ''}" deste chat? 
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
        </div>
    );
}