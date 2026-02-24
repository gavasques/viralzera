import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { 
  Layers, Plus, Search, Youtube
} from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { CardGridSkeleton } from "@/components/common/LoadingSkeleton";
import ModelingCard from "@/components/modeling/ModelingCard";
import ModelingFormModal from "@/components/modeling/ModelingFormModal";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function Modelagem() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { selectedFocusId } = useSelectedFocus();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModeling, setEditingModeling] = useState(null);
  const [modelingToDelete, setModelingToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: modelings = [], isLoading } = useQuery({
    queryKey: ['modelings', selectedFocusId],
    queryFn: async () => {
      const modelingsList = await neon.entities.Modeling.filter({ focus_id: selectedFocusId }, '-created_date', 100);
      
      // Fetch counts for each modeling
      const modelingsWithCounts = await Promise.all(modelingsList.map(async (modeling) => {
        const [videos, texts, links] = await Promise.all([
          neon.entities.ModelingVideo.filter({ modeling_id: modeling.id }),
          neon.entities.ModelingText.filter({ modeling_id: modeling.id }),
          neon.entities.ModelingLink.filter({ modeling_id: modeling.id })
        ]);
        
        return {
          ...modeling,
          video_count: videos.length,
          text_count: texts.length,
          link_count: links.length
        };
      }));
      
      return modelingsWithCounts;
    },
    enabled: !!selectedFocusId
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Delete related videos and texts first
      const videos = await neon.entities.ModelingVideo.filter({ modeling_id: id });
      const texts = await neon.entities.ModelingText.filter({ modeling_id: id });
      
      for (const v of videos) {
        await neon.entities.ModelingVideo.delete(v.id);
      }
      for (const t of texts) {
        await neon.entities.ModelingText.delete(t.id);
      }
      
      return neon.entities.Modeling.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Modelagem excluída!');
    },
    onError: (err) => toast.error('Erro ao excluir: ' + err.message)
  });

  const handleDelete = (modeling) => {
    setModelingToDelete(modeling);
  };

  const confirmDelete = () => {
    if (modelingToDelete) {
      deleteMutation.mutate(modelingToDelete.id);
      setModelingToDelete(null);
    }
  };

  const handleEdit = (modeling) => {
    setEditingModeling(modeling);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingModeling(null);
    setIsFormOpen(true);
  };

  const handleOpen = (modeling) => {
    navigate(createPageUrl('ModelagemDetalhe') + `?id=${modeling.id}`);
  };

  // Filter modelings
  const filteredModelings = modelings.filter(m => 
    !searchTerm || 
    m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredModelings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedModelings = filteredModelings.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!selectedFocusId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Selecione um foco primeiro.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 w-full pb-20">
        <PageHeader title="Modelagem" icon={Layers} />
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-20">
      <PageHeader 
        title="Modelagem" 
        subtitle="Repositório de dados para modelar scripts de YouTube"
        icon={Layers}
        actions={
          <Button 
            onClick={handleNew}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Modelagem
          </Button>
        }
      />

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar modelagens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-slate-500">
          {filteredModelings.length} modelagem(ns)
        </div>
      </div>

      {/* Content */}
      {filteredModelings.length === 0 ? (
        <EmptyState
          icon={Youtube}
          title="Nenhuma modelagem criada"
          description="Crie uma modelagem para começar a adicionar vídeos e textos de referência"
          actionLabel="Nova Modelagem"
          onAction={handleNew}
        />
      ) : (
        <>
          <div className="space-y-3">
            {paginatedModelings.map(modeling => (
              <ModelingCard
                key={modeling.id}
                modeling={modeling}
                onClick={() => handleOpen(modeling)}
                onEdit={() => handleEdit(modeling)}
                onDelete={() => handleDelete(modeling)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? "bg-pink-600 hover:bg-pink-700" : ""}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      <ModelingFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        modeling={editingModeling}
        focusId={selectedFocusId}
      />

      <AlertDialog open={!!modelingToDelete} onOpenChange={(open) => !open && setModelingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação excluirá permanentemente a modelagem 
              <span className="font-medium text-slate-900 mx-1">
                "{modelingToDelete?.title}"
              </span>
              e todos os vídeos, textos e links relacionados a ela.
              <br /><br />
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}