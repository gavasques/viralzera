import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, Folder, Quote, Loader2 } from "lucide-react";
import PhraseCard from "@/components/phrases/PhraseCard";
import PhraseFormModal from "@/components/phrases/PhraseFormModal";
import CategoryFormModal from "@/components/phrases/CategoryFormModal";
import EmptyState from "@/components/common/EmptyState";
import PageHeader from "@/components/common/PageHeader";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";

export default function Phrases() {
  const { selectedFocusId, isLoading: isLoadingFocus } = useSelectedFocus();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showPhraseModal, setShowPhraseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletePhrase, setDeletePhrase] = useState(null);

  // Fetch phrases
  const { data: phrases = [], isLoading: isLoadingPhrases } = useQuery({
    queryKey: ['phrases', selectedFocusId],
    queryFn: () => neon.entities.Phrase.filter(
      { focus_id: selectedFocusId },
      '-created_date'
    ),
    enabled: !!selectedFocusId
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['phrase-categories', selectedFocusId],
    queryFn: () => neon.entities.PhraseCategory.filter(
      { focus_id: selectedFocusId },
      'name'
    ),
    enabled: !!selectedFocusId
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => neon.entities.Phrase.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phrases', selectedFocusId] });
      toast.success('Frase excluída!');
      setDeletePhrase(null);
    },
    onError: (error) => {
      toast.error('Erro ao excluir: ' + error.message);
    }
  });

  // Filter phrases
  const filteredPhrases = phrases.filter(phrase => {
    const matchesSearch = phrase.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         phrase.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || 
                           categoryFilter === 'none' && !phrase.category_id ||
                           phrase.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const isLoading = isLoadingFocus || isLoadingPhrases || isLoadingCategories;

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          icon={Quote}
          title="Frases"
          subtitle="Guarde suas frases favoritas e organize por categorias"
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
              >
                <Folder className="w-4 h-4 mr-2" />
                Gerenciar Categorias
              </Button>
              <Button
                onClick={() => {
                  setEditingPhrase(null);
                  setShowPhraseModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Frase
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar frases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="none">Sem categoria</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phrases List */}
        {filteredPhrases.length === 0 ? (
          <EmptyState
            icon={Quote}
            title={searchTerm || categoryFilter !== 'all' ? "Nenhuma frase encontrada" : "Nenhuma frase cadastrada"}
            description={searchTerm || categoryFilter !== 'all' 
              ? "Tente ajustar os filtros de busca" 
              : "Comece adicionando suas frases favoritas"}
            actionLabel="Adicionar Primeira Frase"
            onAction={() => {
              setEditingPhrase(null);
              setShowPhraseModal(true);
            }}
          />
        ) : (
          <div className="grid gap-4">
            {filteredPhrases.map(phrase => {
              const category = categories.find(c => c.id === phrase.category_id);
              return (
                <PhraseCard
                  key={phrase.id}
                  phrase={phrase}
                  category={category}
                  onEdit={(p) => {
                    setEditingPhrase(p);
                    setShowPhraseModal(true);
                  }}
                  onDelete={(p) => setDeletePhrase(p)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <PhraseFormModal
        open={showPhraseModal}
        onOpenChange={setShowPhraseModal}
        phrase={editingPhrase}
        categories={categories}
        onNewCategory={() => {
          setShowPhraseModal(false);
          setEditingCategory(null);
          setShowCategoryModal(true);
        }}
      />

      <CategoryFormModal
        open={showCategoryModal}
        onOpenChange={(open) => {
          setShowCategoryModal(open);
          if (!open && showPhraseModal) {
            // Reabrir modal de frase após criar categoria
            setTimeout(() => setShowPhraseModal(true), 100);
          }
        }}
        category={editingCategory}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deletePhrase} onOpenChange={() => setDeletePhrase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Frase</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta frase? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletePhrase.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}