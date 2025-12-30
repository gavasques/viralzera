import React, { useState, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import PageHeader from "@/components/common/PageHeader";
import { sendMessage } from "@/components/chat/OpenRouterService";
import ScriptChatSidebar from "@/components/script/ScriptChatSidebar";
import ScriptChatPanel from "@/components/script/ScriptChatPanel";
import NewScriptModal from "@/components/script/NewScriptModal";
import { useCanvas } from "@/components/canvas/CanvasProvider";
import CanvasToggleButton from "@/components/canvas/CanvasToggleButton";

export default function ScriptGenerator() {
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();
  const { sendToCanvas } = useCanvas();
  
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [generatingSessionId, setGeneratingSessionId] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [limit, setLimit] = useState(20);

  // Fetch sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['scriptChats', selectedFocusId, limit],
    queryFn: () => base44.entities.ScriptChat.filter({ focus_id: selectedFocusId }, '-created_date', limit),
    enabled: !!selectedFocusId
  });

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const hasMore = sessions.length >= limit;

  // Mutations
  const createSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.ScriptChat.create({
      ...data,
      focus_id: selectedFocusId,
      status: 'active'
    }),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['scriptChats', selectedFocusId] });
      setActiveSessionId(newSession.id);
      toast.success('Sessão criada!');
    },
    onError: () => toast.error('Erro ao criar sessão')
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScriptChat.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['scriptChats', selectedFocusId, limit] });
      const previousSessions = queryClient.getQueryData(['scriptChats', selectedFocusId, limit]);
      
      queryClient.setQueryData(['scriptChats', selectedFocusId, limit], (old) => {
        if (!old) return [];
        return old.map(session => 
          session.id === id ? { ...session, ...data } : session
        );
      });
      
      return { previousSessions };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(['scriptChats', selectedFocusId, limit], context.previousSessions);
      }
      toast.error('Erro ao atualizar sessão');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scriptChats', selectedFocusId] });
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id) => base44.entities.ScriptChat.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scriptChats', selectedFocusId] });
      if (activeSessionId === deleteSessionMutation.variables) {
        setActiveSessionId(null);
      }
      toast.success('Sessão excluída!');
    },
    onError: () => toast.error('Erro ao excluir sessão')
  });

  const renameSessionMutation = useMutation({
    mutationFn: ({ id, title }) => base44.entities.ScriptChat.update(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scriptChats', selectedFocusId] });
      toast.success('Renomeado!');
    }
  });

  const favoriteSessionMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => base44.entities.ScriptChat.update(id, { is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scriptChats', selectedFocusId] });
    }
  });

  const handleNewSession = useCallback(() => {
    setIsNewModalOpen(true);
  }, []);

  const handleCreateSession = useCallback(async (data) => {
    const { initialMessage, ...sessionData } = data;
    
    // 1. Fetch system prompt first (global config)
    const scriptConfigs = await base44.entities.ScriptConfig.list('-created_date', 1);
    const defaultSystemPrompt = scriptConfigs[0]?.prompt || '';

    // 2. Refine Prompt (Webhook)
    let messageToSend = initialMessage;
    let systemPromptToUse = defaultSystemPrompt;

    try {
        const { data: refinementData } = await base44.functions.invoke('refinePrompt', { 
           prompt: initialMessage,
           systemPrompt: defaultSystemPrompt
        });
        
        if (Array.isArray(refinementData) && refinementData.length > 0) {
            const refined = refinementData[0];
            if (refined.user) messageToSend = refined.user;
            if (refined.system) systemPromptToUse = refined.system;
            toast.success("Prompt e System Prompt refinados com sucesso!");
        } else if (refinementData && typeof refinementData === 'object') {
            const refinedUser = refinementData.user || refinementData.refined_prompt || refinementData.output || refinementData.text || refinementData.prompt;
            if (refinedUser && typeof refinedUser === 'string') messageToSend = refinedUser;
            if (refinementData.system) systemPromptToUse = refinementData.system;
        }
    } catch (error) {
        console.error("Erro ao refinar prompt:", error);
        toast.warning("Usando prompt original (falha no refinamento)");
    }
    
    // 3. Create session with REFINED prompt as user message
    const newSession = await createSessionMutation.mutateAsync({
      ...sessionData,
      messages: [{
        role: 'user',
        content: messageToSend, // Use refined prompt here
        timestamp: new Date().toISOString()
      }]
    });

    // 4. Trigger AI response immediately (no need to refine again)
    setGeneratingSessionId(newSession.id);
    setTimeout(() => {
      handleSendInitialMessage(newSession.id, messageToSend, sessionData, systemPromptToUse)
        .finally(() => setGeneratingSessionId(null));
    }, 500);
  }, [createSessionMutation]);

  const handleSendInitialMessage = async (sessionId, messageToSend, sessionConfig = {}, systemPromptToUse = '') => {
    let model = sessionConfig.model;
    let systemPrompt = systemPromptToUse;

    // Fetch default model/prompt if not provided
    if (!model || !systemPrompt) {
      const scriptConfigs = await base44.entities.ScriptConfig.list('-created_date', 1);
      const scriptConfig = scriptConfigs[0];
      if (!model) model = scriptConfig?.model || 'openai/gpt-4o-mini';
      if (!systemPrompt) systemPrompt = scriptConfig?.prompt || '';
    }

    const apiMessages = [];
    if (systemPrompt) {
      apiMessages.push({ role: 'system', content: systemPrompt });
    }
    apiMessages.push({ role: 'user', content: messageToSend });

    try {
      const response = await sendMessage({
        model,
        messages: apiMessages,
        options: {
          enableReasoning: sessionConfig.enable_reasoning,
          reasoningEffort: sessionConfig.reasoning_effort,
          enableWebSearch: sessionConfig.enable_web_search,
          maxTokens: 4000,
          feature: 'script_chat',
          modelName: sessionConfig.model_name,
          sessionId,
          focusId: selectedFocusId
        }
      });

      const assistantContent = response.content || 'Sem resposta';

      // Update session with assistant response
      const currentSession = (await base44.entities.ScriptChat.filter({ id: sessionId }))[0];
      if (currentSession) {
        await base44.entities.ScriptChat.update(sessionId, {
          messages: [
            ...currentSession.messages,
            {
              role: 'assistant',
              content: assistantContent,
              timestamp: new Date().toISOString(),
              usage: response.usage
            }
          ],
          total_tokens: (currentSession.total_tokens || 0) + (response.usage?.totalTokens || 0)
        });
        queryClient.invalidateQueries({ queryKey: ['scriptChats', selectedFocusId] });
      }
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleUpdateSession = useCallback((updatedSession) => {
    updateSessionMutation.mutate({ 
      id: updatedSession.id, 
      data: { messages: updatedSession.messages } 
    });
  }, [updateSessionMutation]);

  const handleDeleteSession = useCallback((id) => {
    if (confirm('Excluir esta sessão?')) {
      deleteSessionMutation.mutate(id);
    }
  }, [deleteSessionMutation]);

  const handleRenameSession = useCallback((id, newTitle) => {
    renameSessionMutation.mutate({ id, title: newTitle });
  }, [renameSessionMutation]);

  const handleToggleFavorite = useCallback((id) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      favoriteSessionMutation.mutate({ id, is_favorite: !session.is_favorite });
    }
  }, [sessions, favoriteSessionMutation]);

  if (!selectedFocusId) {
    return <div className="p-8">Selecione um foco primeiro.</div>;
  }

  return (
    <div className="space-y-6 -m-6 md:-m-12">
      <div className="px-6 md:px-12 pt-6 md:pt-10">
        <PageHeader
          title="Gerar Script Magnético"
          subtitle="Crie scripts virais com ajuda da IA"
          icon={Sparkles}
          actions={<CanvasToggleButton />}
        />
      </div>

      <div className="flex h-[calc(100vh-180px)] bg-white rounded-t-2xl border border-slate-200 overflow-hidden mx-6 md:mx-12 shadow-sm">
        <div className="w-80 shrink-0 border-r border-slate-200 h-full">
          <ScriptChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onToggleFavorite={handleToggleFavorite}
            hasMore={hasMore}
            onLoadMore={() => setLimit(prev => prev + 20)}
          />
        </div>

        <ScriptChatPanel
          session={activeSession}
          onUpdateSession={handleUpdateSession}
          isGenerating={generatingSessionId === activeSession?.id}
          onSendToCanvas={(content, title) => sendToCanvas(
            content, 
            title || 'Script', 
            'script_generator', 
            activeSession?.id,
            selectedFocusId
          )}
        />
      </div>

      <NewScriptModal
        open={isNewModalOpen}
        onOpenChange={setIsNewModalOpen}
        onCreate={handleCreateSession}
      />
    </div>
  );
}