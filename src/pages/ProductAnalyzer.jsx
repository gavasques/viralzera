import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Package, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";

import ProductChatSidebar from "@/components/product/ProductChatSidebar";
import ProductChatPanel from "@/components/product/ProductChatPanel";
import ChatSettingsModal from "@/components/chat/ChatSettingsModal";
import { getAgentConfig } from "@/components/constants/agentConfigs";

export default function ProductAnalyzer() {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  
  // New Session Form State
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [showOtherProducts, setShowOtherProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();

  // Fetch personas
  const { data: personas = [] } = useQuery({
    queryKey: ['personas', selectedFocusId],
    queryFn: () => base44.entities.Persona.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products', selectedFocusId],
    queryFn: () => base44.entities.Product.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId
  });

  // Fetch sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['productChats', selectedFocusId],
    queryFn: () => base44.entities.ProductChat.filter(
      { focus_id: selectedFocusId }, 
      '-created_date', 
      50
    ),
    enabled: !!selectedFocusId
  });

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProductChat.create(data),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['productChats'] });
      setActiveSessionId(newSession.id);
      setShowNewSession(false);
      resetForm();
      toast.success('Análise iniciada!');
    }
  });

  // Update session mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProductChat.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productChats'] });
    }
  });

  // Delete session mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProductChat.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productChats'] });
      if (activeSessionId) setActiveSessionId(null);
      toast.success('Análise removida!');
    }
  });

  // Rename session mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }) => base44.entities.ProductChat.update(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productChats'] });
      toast.success('Renomeado!');
    }
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => base44.entities.ProductChat.update(id, { is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productChats'] });
    }
  });

  const resetForm = () => {
    setNewSessionTitle('');
    setSelectedPersonaId('');
    setShowOtherProducts(false);
    setSelectedProductIds([]);
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const buildOtherProductsContext = () => {
    if (selectedProductIds.length === 0) return '';
    
    const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));
    let context = '\n\n📦 **MEUS OUTROS PRODUTOS (para referência de estilo e contexto):**\n';
    
    selectedProducts.forEach((product, index) => {
      context += `\n--- Produto ${index + 1}: ${product.name} ---\n`;
      context += `- Tipo: ${product.type || 'N/A'}\n`;
      if (product.description) context += `- Descrição: ${product.description}\n`;
      if (product.benefits) context += `- Benefícios: ${product.benefits}\n`;
      if (product.problem_solved) context += `- Problema que resolve: ${product.problem_solved}\n`;
      if (product.price_type) context += `- Modelo de preço: ${product.price_type}\n`;
      if (product.price) context += `- Valor: R$ ${product.price}\n`;
    });
    
    context += '\nUse esses produtos como referência para manter consistência de estilo, tom e posicionamento.';
    return context;
  };

  const handleNewSession = useCallback(() => {
    resetForm();
    setShowNewSession(true);
  }, []);

  const handleCreateSession = useCallback(() => {
    if (!newSessionTitle.trim()) {
      toast.error('Digite um nome para o produto');
      return;
    }
    
    const otherProductsContext = buildOtherProductsContext();
    const initialMessage = `Vamos analisar seu produto/serviço! O que exatamente você oferece e qual é o resultado principal que ele entrega?${otherProductsContext ? '\n\n*Estou ciente dos seus outros produtos e vou manter consistência com eles.*' : ''}`;
    
    createMutation.mutate({
      focus_id: selectedFocusId,
      persona_id: selectedPersonaId || null,
      title: newSessionTitle,
      other_products_context: otherProductsContext || null,
      messages: [{
        role: "assistant",
        content: initialMessage,
        timestamp: new Date().toISOString()
      }],
      status: 'active'
    });
  }, [newSessionTitle, selectedPersonaId, selectedFocusId, selectedProductIds, products, createMutation]);

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
          <Link to={createPageUrl('Products')}>
            <Button variant="ghost" size="icon" className="hover:bg-slate-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Analisador de Produtos AI
            </h1>
          </div>
        </div>
      </div>

      {/* Main Layout - Full Height Split */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r bg-white flex flex-col shrink-0">
          <ProductChatSidebar
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
          <ProductChatPanel
            session={activeSession}
            onUpdateSession={handleUpdateSession}
            focusId={selectedFocusId}
            onNewSession={handleNewSession}
            personas={personas}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <ChatSettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings}
        {...getAgentConfig('product')}
      />

      {/* New Session Modal */}
      <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Análise de Produto</DialogTitle>
            <DialogDescription>
              Qual produto você quer analisar hoje?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Nome do Produto (para identificação)</Label>
              <Input
                placeholder="Ex: Curso de Marketing, Consultoria..."
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
              />
            </div>

            {/* Persona Selection */}
            <div className="space-y-2">
              <Label>Persona (opcional)</Label>
              <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma persona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem persona específica</SelectItem>
                  {personas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      {persona.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Other Products Section */}
            {products.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowOtherProducts(!showOtherProducts)}
                  className="flex items-center justify-between w-full p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-slate-700">
                      Mostrar meus outros produtos para a IA
                    </span>
                    {selectedProductIds.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                        {selectedProductIds.length} selecionados
                      </span>
                    )}
                  </div>
                  {showOtherProducts ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                
                {showOtherProducts && (
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                    <p className="text-xs text-slate-500 mb-3">
                      Selecione produtos para a IA usar como referência de estilo e posicionamento.
                    </p>
                    <ScrollArea className="max-h-40">
                      <div className="space-y-2">
                        {products.map((product) => (
                          <label
                            key={product.id}
                            className="flex items-start gap-3 p-2 rounded-md hover:bg-white cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={selectedProductIds.includes(product.id)}
                              onCheckedChange={() => toggleProductSelection(product.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {product.type} {product.price ? `• R$ ${product.price}` : ''}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNewSession(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateSession}
                disabled={createMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending ? 'Criando...' : 'Iniciar Análise'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}