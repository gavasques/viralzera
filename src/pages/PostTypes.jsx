import React, { useState, useCallback, useMemo } from 'react';
import { neon } from "@/api/neonClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Layers, FileText, Instagram } from "lucide-react";
import InstagramImporter from "@/components/instagram/InstagramImporter";
import ExamplesListModal from "@/components/post-types/ExamplesListModal";
import PostTypeCard from "@/components/post-types/PostTypeCard";
import PostTypeFormModal from "@/components/post-types/PostTypeFormModal";
import PostTypeFilters from "@/components/post-types/PostTypeFilters";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useFocusData } from "@/components/hooks/useFocusData";
import PageHeader from "@/components/common/PageHeader";
import { CardGridSkeleton } from "@/components/common/LoadingSkeleton";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function PostTypes() {
  const queryClient = useQueryClient();
  
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [originalEditingType, setOriginalEditingType] = useState(null);
  const [editingExampleIndex, setEditingExampleIndex] = useState(null);
  const [exampleForm, setExampleForm] = useState({ content: "", comment: "", source_type: "third_party" });
  const [showInstagramImporter, setShowInstagramImporter] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [currentTypeForList, setCurrentTypeForList] = useState(null);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const { data: postTypes, isLoading, selectedFocusId, hasFocus } = useFocusData('PostType', 'postTypes');

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    channel: 'all',
    format: 'all',
    status: 'all'
  });

  // Filter counts
  const filterCounts = useMemo(() => {
    if (!postTypes) return { total: 0 };
    const counts = { total: postTypes.length };
    postTypes.forEach(pt => {
      const channel = pt.channel || 'Instagram';
      counts[channel] = (counts[channel] || 0) + 1;
    });
    return counts;
  }, [postTypes]);

  // Filtered post types
  const filteredPostTypes = useMemo(() => {
    if (!postTypes) return [];
    
    return postTypes.filter(pt => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch = 
          pt.title?.toLowerCase().includes(search) ||
          pt.description?.toLowerCase().includes(search) ||
          pt.format?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Channel filter
      if (filters.channel !== 'all') {
        const ptChannel = pt.channel || 'Instagram';
        if (ptChannel !== filters.channel) return false;
      }
      
      // Format filter
      if (filters.format !== 'all') {
        if (pt.format !== filters.format) return false;
      }
      
      // Status filter
      if (filters.status !== 'all') {
        const isActive = pt.is_active !== false;
        if (filters.status === 'active' && !isActive) return false;
        if (filters.status === 'inactive' && isActive) return false;
      }
      
      return true;
    });
  }, [postTypes, filters]);

  // Mutations
  const saveTypeMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, focus_id: selectedFocusId };
      if (editingType?.id) return neon.entities.PostType.update(editingType.id, payload);
      return neon.entities.PostType.create(payload);
    },
    onSuccess: () => {
      toast.success(editingType ? "Tipo atualizado!" : "Tipo criado!");
      queryClient.invalidateQueries({ queryKey: ['postTypes', selectedFocusId] });
      setIsTypeModalOpen(false);
      setEditingType(null);
    },
    onError: () => toast.error("Erro ao salvar tipo.")
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id) => neon.entities.PostType.delete(id),
    onSuccess: () => {
      toast.success("Tipo removido!");
      queryClient.invalidateQueries({ queryKey: ['postTypes', selectedFocusId] });
    },
    onError: () => toast.error("Erro ao remover.")
  });

  const addExampleMutation = useMutation({
    mutationFn: (newExample) => {
      const currentExamples = editingType.examples || [];
      const safeExamples = currentExamples.map(ex => typeof ex === 'string' ? { content: ex, comment: "" } : ex);
      const updatedExamples = [...safeExamples, newExample];
      return neon.entities.PostType.update(editingType.id, { examples: updatedExamples });
    },
    onSuccess: () => {
      toast.success("Exemplo adicionado!");
      queryClient.invalidateQueries({ queryKey: ['postTypes', selectedFocusId] });
      setIsExampleModalOpen(false);
      setEditingType(null);
      setExampleForm({ content: "", comment: "" });
    },
    onError: () => toast.error("Erro ao adicionar exemplo.")
  });

  const handleOpenTypeModal = useCallback((type = null) => {
    setEditingType(type);
    setIsTypeModalOpen(true);
  }, []);

  const toggleActiveStatus = useCallback(async (type) => {
    const newStatus = type.is_active === false ? true : false;
    try {
      await neon.entities.PostType.update(type.id, { is_active: newStatus });
      queryClient.invalidateQueries({ queryKey: ['postTypes', selectedFocusId] });
      toast.success(newStatus ? "Tipo ativado!" : "Tipo inativado!");
    } catch (err) {
      toast.error("Erro ao alterar status.");
    }
  }, [queryClient, selectedFocusId]);

  const handleOpenExampleModal = useCallback((type, example = null, index = null) => {
    setEditingType(type);
    setOriginalEditingType(type);
    if (example) {
      setExampleForm({ 
        content: typeof example === 'string' ? example : example.content, 
        comment: typeof example === 'string' ? "" : (example.comment || ""),
        source_type: typeof example === 'string' ? "third_party" : (example.source_type || "third_party")
      });
      setEditingExampleIndex(index);
    } else {
      setExampleForm({ content: "", comment: "", source_type: "third_party" });
      setEditingExampleIndex(null);
      setOriginalEditingType(null);
    }
    setIsExampleModalOpen(true);
  }, []);

  const handleDeleteType = useCallback((id) => {
    setTypeToDelete(id);
  }, []);

  const handleSaveType = useCallback((formData) => {
    saveTypeMutation.mutate(formData);
  }, [saveTypeMutation]);

  const updateExamplesMutation = useMutation({
    mutationFn: ({ typeId, examples, removeFromTypeId, removeIndex }) => {
      // Se estiver movendo para outro tipo, precisa remover do original também
      if (removeFromTypeId && removeFromTypeId !== typeId) {
        const originalType = postTypes?.find(pt => pt.id === removeFromTypeId);
        if (originalType) {
          const originalExamples = (originalType.examples || []).filter((_, i) => i !== removeIndex);
          neon.entities.PostType.update(removeFromTypeId, { examples: originalExamples });
        }
      }
      return neon.entities.PostType.update(typeId, { examples });
    },
    onSuccess: () => {
      toast.success("Lista de exemplos atualizada!");
      queryClient.invalidateQueries({ queryKey: ['postTypes', selectedFocusId] });
    },
    onError: () => toast.error("Erro ao atualizar exemplos.")
  });

  const handleSaveExample = useCallback(() => {
    if (!exampleForm.content.trim()) return toast.error("O conteúdo do exemplo é obrigatório");
    
    if (editingExampleIndex !== null) {
      // Verificar se mudou de tipo
      const isMovingToNewType = originalEditingType && editingType && originalEditingType.id !== editingType.id;
      
      if (isMovingToNewType) {
        // Adicionar no novo tipo
        const newTypeExamples = editingType.examples || [];
        const safeNewExamples = newTypeExamples.map(ex => typeof ex === 'string' ? { content: ex, comment: "" } : ex);
        const updatedNewExamples = [...safeNewExamples, exampleForm];
        
        updateExamplesMutation.mutate({ 
          typeId: editingType.id, 
          examples: updatedNewExamples,
          removeFromTypeId: originalEditingType.id,
          removeIndex: editingExampleIndex
        }, {
          onSuccess: () => {
            setIsExampleModalOpen(false);
            setEditingExampleIndex(null);
            setExampleForm({ content: "", comment: "" });
            setEditingType(null);
            setOriginalEditingType(null);
          }
        });
      } else {
        // Atualizar no mesmo tipo
        const currentExamples = editingType.examples || [];
        const safeExamples = currentExamples.map(ex => typeof ex === 'string' ? { content: ex, comment: "" } : ex);
        const newExamples = [...safeExamples];
        newExamples[editingExampleIndex] = exampleForm;
        
        updateExamplesMutation.mutate({ typeId: editingType.id, examples: newExamples }, {
          onSuccess: () => {
            setIsExampleModalOpen(false);
            setEditingExampleIndex(null);
            setExampleForm({ content: "", comment: "" });
            setEditingType(null);
            setOriginalEditingType(null);
          }
        });
      }
    } else {
      addExampleMutation.mutate(exampleForm);
    }
  }, [exampleForm, editingExampleIndex, editingType, originalEditingType, updateExamplesMutation, addExampleMutation]);

  const handleSourceTypeChange = (value) => {
    setExampleForm(prev => ({ ...prev, source_type: value }));
  };

  const handleDeleteExampleFromList = useCallback((type, index) => {
    const currentExamples = type.examples || [];
    const newExamples = currentExamples.filter((_, i) => i !== index);
    updateExamplesMutation.mutate({ typeId: type.id, examples: newExamples });
  }, [updateExamplesMutation]);

  const handleOpenListModal = useCallback((type) => {
    setCurrentTypeForList(type);
    setIsListModalOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
        <PageHeader title="Tipos de Postagens" subtitle="Carregando..." icon={Layers} />
        <CardGridSkeleton count={6} columns={3} />
      </div>
    );
  }

  if (!hasFocus) return <div className="p-8">Selecione um foco primeiro.</div>;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="Tipos de Postagens" 
        subtitle="Biblioteca de formatos editoriais."
        icon={Layers}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => handleOpenTypeModal()} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200">
                <Plus className="w-4 h-4 mr-2" /> Novo Tipo
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <PostTypeFilters 
        filters={filters}
        onFilterChange={setFilters}
        counts={filterCounts}
        postTypes={postTypes || []}
      />

      <ExamplesListModal 
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        postType={postTypes?.find(t => t.id === currentTypeForList?.id) || currentTypeForList} 
        onDeleteExample={handleDeleteExampleFromList}
        onAddExampleClick={(type) => handleOpenExampleModal(type)}
        onEditExample={(type, example, index) => handleOpenExampleModal(type, example, index)}
      />

      {/* Results */}
      {filteredPostTypes.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-medium text-slate-700 mb-2">Nenhum tipo encontrado</h3>
          <p className="text-sm text-slate-500 mb-4">
            {filters.search || filters.channel !== 'all' || filters.format !== 'all' || filters.status !== 'all'
              ? 'Tente ajustar os filtros para encontrar outros tipos.'
              : 'Comece criando seu primeiro tipo de postagem.'}
          </p>
          <Button onClick={() => handleOpenTypeModal()} variant="outline">
            <Plus className="w-4 h-4 mr-2" /> Criar Tipo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPostTypes.map((type) => (
            <PostTypeCard
              key={type.id}
              type={type}
              onToggleStatus={toggleActiveStatus}
              onEdit={handleOpenTypeModal}
              onDelete={handleDeleteType}
              onOpenList={handleOpenListModal}
              onAddExample={handleOpenExampleModal}
            />
          ))}
        </div>
      )}

      {/* Modal: Create/Edit Type - NEW COMPONENT */}
      <PostTypeFormModal
        open={isTypeModalOpen}
        onOpenChange={setIsTypeModalOpen}
        initialData={editingType}
        onSave={handleSaveType}
        isSaving={saveTypeMutation.isPending}
      />

      <ConfirmDialog
        open={!!typeToDelete}
        onOpenChange={(open) => !open && setTypeToDelete(null)}
        title="Excluir Tipo de Postagem"
        description="Tem certeza que deseja excluir este tipo de postagem? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => {
          if (typeToDelete) {
            deleteTypeMutation.mutate(typeToDelete);
            setTypeToDelete(null);
          }
        }}
      />

      {/* Modal: Add Single Example */}
      <Dialog open={isExampleModalOpen} onOpenChange={(open) => {
        setIsExampleModalOpen(open);
        if (!open) setShowInstagramImporter(false);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExampleIndex !== null ? 'Editar Exemplo' : 'Adicionar Exemplo'}</DialogTitle>
            <DialogDescription>
              {editingExampleIndex !== null ? 'Editando exemplo de: ' : 'Adicionando ao tipo: '}
              {editingExampleIndex !== null ? (
                <select
                  value={editingType?.id || ''}
                  onChange={(e) => {
                    const newType = postTypes?.find(pt => pt.id === e.target.value);
                    if (newType) setEditingType(newType);
                  }}
                  className="font-semibold text-indigo-600 bg-transparent border-b border-indigo-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {postTypes?.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.title}</option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-indigo-600">{editingType?.title}</span>
              )}
              {editingType?.format && (
                <Badge variant="outline" className="ml-2">{editingType.format}</Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Source Type Selection */}
            <div className="bg-slate-100 p-1 rounded-lg flex mb-6">
              <button
                  onClick={() => handleSourceTypeChange('third_party')}
                  className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${
                      exampleForm.source_type !== 'mine' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                  Referência (Terceiros)
              </button>
              <button
                  onClick={() => handleSourceTypeChange('mine')}
                  className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${
                      exampleForm.source_type === 'mine' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                  Autoral (Meu)
              </button>
            </div>

            {/* Instagram Import Toggle - Carrossel, Post and Reels */}
            {(editingType?.format === 'Carrossel' || editingType?.format === 'Post' || editingType?.format === 'Reels' || !editingType?.format) && (
              <div className="flex gap-2 mb-4">
                <Button
                  variant={!showInstagramImporter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowInstagramImporter(false)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Manual
                </Button>
                <Button
                  variant={showInstagramImporter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowInstagramImporter(true)}
                  className={showInstagramImporter ? "bg-gradient-to-r from-pink-500 to-purple-500" : ""}
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Importar do Instagram
                </Button>
              </div>
            )}

            {showInstagramImporter ? (
              <InstagramImporter 
                postTypeFormat={editingType?.format || 'Post'}
                onImport={(data) => {
                  setExampleForm(data);
                  setShowInstagramImporter(false);
                }}
              />
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Conteúdo do Exemplo <Badge variant="outline" className="text-xs font-normal ml-2">Máx 5000 caracteres</Badge></Label>
                  <Textarea 
                    placeholder="Cole aqui o roteiro, legenda ou descrição do exemplo..." 
                    value={exampleForm.content}
                    onChange={(e) => setExampleForm(prev => ({ ...prev, content: e.target.value.slice(0, 5000) }))}
                    className="h-48 resize-none font-mono text-sm"
                  />
                  <div className="text-xs text-right text-slate-400">
                    {exampleForm.content.length}/5000
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Seu Comentário (Opcional)</Label>
                  <Input 
                    placeholder="Por que esse exemplo é bom? O que observar?" 
                    value={exampleForm.comment}
                    onChange={(e) => setExampleForm(prev => ({ ...prev, comment: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExampleModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveExample} disabled={addExampleMutation.isPending || updateExamplesMutation.isPending || !exampleForm.content.trim()}>
              {addExampleMutation.isPending || updateExamplesMutation.isPending ? 'Salvando...' : (editingExampleIndex !== null ? 'Salvar Alterações' : 'Adicionar Exemplo')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}