import React, { useState, useMemo, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, ChevronRight, ChevronDown, FolderTree, Folder, Hash } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useFocusData } from "@/components/hooks/useFocusData";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";
import ThemeExcelImporter from "@/components/theme/ThemeExcelImporter";

// Helper to organize flat list into tree - memoized outside component
const buildTree = (items) => {
  if (!items?.length) return [];
  const map = {};
  const roots = [];
  
  items.forEach(item => {
    map[item.id] = { ...item, children: [] };
  });
  
  items.forEach(item => {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id]);
    } else if (item.level === 1) {
      roots.push(map[item.id]);
    }
  });
  
  return roots;
};

export default function ThemeMatrix() {
  const queryClient = useQueryClient();
  
  const [expandedNodes, setExpandedNodes] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [parentTheme, setParentTheme] = useState(null);
  const [formData, setFormData] = useState({ title: "" });

  const { data: themes, isLoading, selectedFocusId, hasFocus } = useFocusData('Theme', 'themes', { 
    sortBy: 'created_date', 
    limit: 1000 
  });

  const treeData = useMemo(() => buildTree(themes), [themes]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        title: data.title,
        focus_id: selectedFocusId,
        level: data.level,
        parent_id: data.parent_id || null
      };
      
      if (editingTheme) return base44.entities.Theme.update(editingTheme.id, { title: data.title });
      return base44.entities.Theme.create(payload);
    },
    onSuccess: () => {
      toast.success(editingTheme ? "Tema atualizado!" : "Tema criado!");
      queryClient.invalidateQueries({ queryKey: ['themes', selectedFocusId] });
      handleCloseModal();
    },
    onError: () => toast.error("Erro ao salvar tema.")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Check if has children locally first
      const hasChildren = themes.some(t => t.parent_id === id);
      if (hasChildren) throw new Error("Não é possível excluir temas que possuem subtemas.");
      return base44.entities.Theme.delete(id);
    },
    onSuccess: () => {
      toast.success("Tema excluído!");
      queryClient.invalidateQueries({ queryKey: ['themes', selectedFocusId] });
    },
    onError: (err) => toast.error(err.message || "Erro ao excluir.")
  });

  // Actions - memoized with useCallback
  const toggleExpand = useCallback((id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleAddRoot = useCallback(() => {
    setEditingTheme(null);
    setParentTheme(null);
    setFormData({ title: "" });
    setIsModalOpen(true);
  }, []);

  const handleAddChild = useCallback((parent) => {
    if (parent.level >= 3) return;
    setEditingTheme(null);
    setParentTheme(parent);
    setFormData({ title: "" });
    setIsModalOpen(true);
    setExpandedNodes(prev => ({ ...prev, [parent.id]: true }));
  }, []);

  const handleEdit = useCallback((theme) => {
    setEditingTheme(theme);
    setParentTheme(null);
    setFormData({ title: theme.title });
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback((id) => {
    if (confirm("Tem certeza que deseja excluir este tema?")) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleSubmit = useCallback(() => {
    if (!formData.title.trim()) return toast.error("O título é obrigatório");
    
    let level = 1;
    let parent_id = null;

    if (editingTheme) {
      level = editingTheme.level;
      parent_id = editingTheme.parent_id;
    } else if (parentTheme) {
      level = parentTheme.level + 1;
      parent_id = parentTheme.id;
    }

    saveMutation.mutate({ title: formData.title, level, parent_id });
  }, [formData, editingTheme, parentTheme, saveMutation]);

  // Render Node Component
  const ThemeNode = ({ node }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    
    // Icons based on level
    const LevelIcon = node.level === 1 ? FolderTree : (node.level === 2 ? Folder : Hash);
    const colorClass = node.level === 1 ? "text-indigo-600 bg-indigo-50" : (node.level === 2 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50");

    return (
      <div className="select-none">
        <div className={cn(
          "group flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all mb-1",
          editingTheme?.id === node.id && "bg-indigo-50 border-indigo-200"
        )}>
          <button 
            onClick={() => toggleExpand(node.id)}
            className={cn("p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors", !hasChildren && "invisible")}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          
          <div className={cn("p-1.5 rounded-md", colorClass)}>
            <LevelIcon className="w-4 h-4" />
          </div>

          <span className="font-medium text-slate-700 flex-1">{node.title}</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.level < 3 && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => handleAddChild(node)} title="Adicionar subnível">
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-600" onClick={() => handleEdit(node)} title="Editar">
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => handleDelete(node.id)} title="Excluir">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-6 pl-4 border-l border-slate-200">
            {node.children.map(child => (
              <ThemeNode key={child.id} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTheme(null);
    setParentTheme(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full pb-20">
        <PageHeader title="Matriz de Temas" subtitle="Carregando..." icon={FolderTree} />
        <PageSkeleton />
      </div>
    );
  }

  if (!hasFocus) return <div className="p-8">Selecione um foco primeiro.</div>;

  return (
    <div className="space-y-6 w-full pb-20">
      <PageHeader 
        title="Matriz de Temas" 
        subtitle="Organize seu conteúdo em 3 níveis hierárquicos."
        icon={FolderTree}
        actions={
          <div className="flex gap-2">
            <ThemeExcelImporter 
              focusId={selectedFocusId} 
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['themes', selectedFocusId] })} 
            />
            <Button onClick={handleAddRoot} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200">
              <Plus className="w-4 h-4 mr-2" /> Novo Tema Principal
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2"><FolderTree className="w-4 h-4 text-indigo-500" /> Nível 1: Tema</div>
            <div className="flex items-center gap-2"><Folder className="w-4 h-4 text-amber-500" /> Nível 2: Subtema</div>
            <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-emerald-500" /> Nível 3: Específico</div>
          </div>
        </CardHeader>
        <CardContent className="p-6 min-h-[400px]">
          {treeData.length > 0 ? (
            <div className="space-y-2">
              {treeData.map(node => (
                <ThemeNode key={node.id} node={node} />
              ))}
            </div>
          ) : (
            <EmptyState 
              icon={FolderTree}
              description="Nenhum tema cadastrado ainda."
              actionLabel="Criar primeiro tema"
              onAction={handleAddRoot}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTheme 
                ? 'Editar Tema' 
                : (parentTheme ? `Novo Subtema em "${parentTheme.title}"` : 'Novo Tema Principal')}
            </DialogTitle>
            <DialogDescription>
              {parentTheme 
                ? `Este item será criado no nível ${parentTheme.level + 1}` 
                : 'Este item será criado no nível 1 (Raiz)'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Título do Tema</Label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData({ title: e.target.value })}
                placeholder="Ex: Marketing Digital, Como fazer..."
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}