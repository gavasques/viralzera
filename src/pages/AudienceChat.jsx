import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, MessageSquare, Plus, User, Package, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";

import AudienceChatSidebar from "@/components/audience/AudienceChatSidebar.jsx";
import AudienceChatPanel from "@/components/audience/AudienceChatPanel.jsx";

export default function AudienceChat() {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showNewSession, setShowNewSession] = useState(false);
  
  // New Session Form State
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();

  // Fetch sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['audienceChats', selectedFocusId],
    queryFn: () => base44.entities.AudienceChat.filter(
      { focus_id: selectedFocusId }, 
      '-created_date', 
      50
    ),
    enabled: !!selectedFocusId
  });

  // Fetch personas for the focus
  const { data: personas = [] } = useQuery({
    queryKey: ['personas', selectedFocusId],
    queryFn: () => base44.entities.Persona.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId
  });

  // Fetch products for the focus
  const { data: products = [] } = useQuery({
    queryKey: ['products', selectedFocusId],
    queryFn: () => base44.entities.Product.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId
  });

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AudienceChat.create(data),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['audienceChats'] });
      setActiveSessionId(newSession.id);
      setShowNewSession(false);
      resetForm();
      toast.success('Público criado!');
    }
  });

  // Update session mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AudienceChat.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audienceChats'] });
    }
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AudienceChat.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audienceChats'] });
      if (activeSessionId) setActiveSessionId(null);
      toast.success('Público removido!');
    }
  });

  // Rename session mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }) => base44.entities.AudienceChat.update(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audienceChats'] });
      toast.success('Renomeado!');
    }
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => base44.entities.AudienceChat.update(id, { is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audienceChats'] });
    }
  });

  const resetForm = () => {
    setNewSessionTitle('');
    setSelectedPersonaId('');
    setSelectedProductIds([]);
  };

  const handleNewSession = useCallback(() => {
    resetForm();
    setShowNewSession(true);
  }, []);

  const handleCreateSession = useCallback(() => {
    if (!newSessionTitle.trim()) {
      toast.error('Digite um título para o público');
      return;
    }
    
    createMutation.mutate({
      focus_id: selectedFocusId,
      title: newSessionTitle,
      messages: [],
      status: 'active',
      persona_id: selectedPersonaId || null,
      product_ids: selectedProductIds
    });
  }, [newSessionTitle, selectedPersonaId, selectedProductIds, selectedFocusId, createMutation]);

  const handleUpdateSession = useCallback((updatedSession) => {
    updateMutation.mutate({ 
      id: updatedSession.id, 
      data: {
        messages: updatedSession.messages,
        // Persona and products are immutable in this context as per request
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

  const toggleProduct = (productId) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="fixed inset-0 top-0 md:left-64 bg-slate-50 flex flex-col z-0">
      {/* Header - Minimalist */}
      <div className="h-16 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Audiences')}>
            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Gerador de Público Alvo com IA
            </h1>
          </div>
        </div>
      </div>

      {/* Main Layout - Full Height Split */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r bg-white flex flex-col shrink-0">
          <AudienceChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
        
        <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
          <AudienceChatPanel
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            focusId={selectedFocusId}
            personas={personas}
            onNewSession={handleNewSession}
          />
        </div>
      </div>

      {/* New Session Modal */}
      <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Público</DialogTitle>
            <DialogDescription>
              Configure o contexto para a IA gerar seu público-alvo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Nome do Público</Label>
              <Input
                placeholder="Ex: Público para curso de vendas"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
              />
            </div>

            {/* Persona Selection */}
            <div className="space-y-2">
              <Label>Selecionar Persona (Quem é você)</Label>
              <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma persona..." />
                </SelectTrigger>
                <SelectContent>
                  {personas.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500 text-center">Nenhuma persona cadastrada</div>
                  ) : (
                    personas.map((persona) => (
                      <SelectItem key={persona.id} value={persona.id}>
                        {persona.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {personas.length === 0 && (
                <Link to={createPageUrl('Personas')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Criar nova persona
                </Link>
              )}
            </div>

            {/* Product Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Produtos Relacionados (Opcional)</Label>
                {products.length === 0 && (
                  <Link to={createPageUrl('Products')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Cadastrar produto
                  </Link>
                )}
              </div>
              
              {products.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-center border border-dashed">
                  Nenhum produto cadastrado neste foco.
                </div>
              ) : (
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-slate-50/50">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-start gap-2 p-2 rounded hover:bg-white transition-colors">
                      <Checkbox 
                        id={`prod-${product.id}`}
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                      <div className="grid gap-0.5">
                        <label 
                          htmlFor={`prod-${product.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {product.name}
                        </label>
                        <p className="text-xs text-slate-500">{product.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                {createMutation.isPending ? 'Criando...' : 'Criar Público'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}