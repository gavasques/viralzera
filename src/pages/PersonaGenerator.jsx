import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, User, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";

import PersonaChatSidebar from "@/components/persona/PersonaChatSidebar";
import PersonaChatPanel from "@/components/persona/PersonaChatPanel";
import ChatSettingsModal from "@/components/chat/ChatSettingsModal";
import { getAgentConfig } from "@/components/constants/agentConfigs";

export default function PersonaGenerator() {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  
  // New Session Form State
  const [newSessionTitle, setNewSessionTitle] = useState('');
  
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();

  // Fetch sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['personaChats', selectedFocusId],
    queryFn: () => base44.entities.PersonaChat.filter(
      { focus_id: selectedFocusId }, 
      '-created_date', 
      50
    ),
    enabled: !!selectedFocusId
  });

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PersonaChat.create(data),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['personaChats'] });
      setActiveSessionId(newSession.id);
      setShowNewSession(false);
      resetForm();
      toast.success('Entrevista iniciada!');
    }
  });

  // Update session mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PersonaChat.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personaChats'] });
    }
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonaChat.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personaChats'] });
      if (activeSessionId) setActiveSessionId(null);
      toast.success('Entrevista removida!');
    }
  });

  // Rename session mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }) => base44.entities.PersonaChat.update(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personaChats'] });
      toast.success('Renomeado!');
    }
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => base44.entities.PersonaChat.update(id, { is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personaChats'] });
    }
  });

  const resetForm = () => {
    setNewSessionTitle('');
  };

  const handleNewSession = useCallback(() => {
    resetForm();
    setShowNewSession(true);
  }, []);

  const handleCreateSession = useCallback(() => {
    if (!newSessionTitle.trim()) {
      toast.error('Digite um nome para a persona');
      return;
    }
    
    createMutation.mutate({
      focus_id: selectedFocusId,
      title: newSessionTitle,
      messages: [{
        role: "assistant",
        content: "Vamos começar! Me conta sua história em 3 minutos - de onde você veio até onde está hoje. Pode ser informal, como se estivesse conversando com um amigo.",
        timestamp: new Date().toISOString()
      }],
      status: 'active'
    });
  }, [newSessionTitle, selectedFocusId, createMutation]);

  const handleUpdateSession = useCallback((updatedSession) => {
    updateMutation.mutate({ 
      id: updatedSession.id, 
      data: {
        messages: updatedSession.messages,
      }
    });
  }, [updateMutation]);

  const handleDeleteSession = useCallback((id) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleRenameSession = useCallback((id, newTitle) => {
    renameMutation.mutate({ id, title: newTitle });
  }, [renameMutation]);

  const handleToggleFavorite = useCallback((id) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      favoriteMutation.mutate({ id, is_favorite: !session.is_favorite });
    }
  }, [sessions, favoriteMutation]);

  return (
    <div className="fixed inset-0 top-0 md:left-64 bg-slate-50 flex flex-col z-0">
      {/* Header - Minimalist */}
      <div className="h-16 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Personas')}>
            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Gerador de Personas com IA
            </h1>
          </div>
        </div>
      </div>

      {/* Main Layout - Full Height Split */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r bg-white flex flex-col shrink-0">
          <PersonaChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onToggleFavorite={handleToggleFavorite}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>
        
        <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
          <PersonaChatPanel
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            focusId={selectedFocusId}
            onNewSession={handleNewSession}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <ChatSettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings}
        {...getAgentConfig('persona')}
      />

      {/* New Session Modal */}
      <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Entrevista de Persona</DialogTitle>
            <DialogDescription>
              Vamos criar uma nova persona através de uma entrevista guiada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Nome da Persona</Label>
              <Input
                placeholder="Ex: Eu mesmo (Versão Autoridade), Especialista Técnico..."
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNewSession(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateSession}
                disabled={createMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending ? 'Criando...' : 'Iniciar Entrevista'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}