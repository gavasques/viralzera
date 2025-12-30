import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const { data: modelings = [], isLoading } = useQuery({
    queryKey: ['modelings', selectedFocusId],
    queryFn: () => base44.entities.Modeling.filter({ focus_id: selectedFocusId }, '-created_date', 100),
    enabled: !!selectedFocusId
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // Delete related videos and texts first
      const videos = await base44.entities.ModelingVideo.filter({ modeling_id: id });
      const texts = await base44.entities.ModelingText.filter({ modeling_id: id });
      
      for (const v of videos) {
        await base44.entities.ModelingVideo.delete(v.id);
      }
      for (const t of texts) {
        await base44.entities.ModelingText.delete(t.id);
      }
      
      return base44.entities.Modeling.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modelings'] });
      toast.success('Modelagem excluída!');
    },
    onError: (err) => toast.error('Erro ao excluir: ' + err.message)
  });

  const handleDelete = (modeling) => {
    if (confirm(`Excluir "${modeling.title}" e todos os vídeos/textos relacionados?`)) {
      deleteMutation.mutate(modeling.id);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModelings.map(modeling => (
            <ModelingCard
              key={modeling.id}
              modeling={modeling}
              onClick={() => handleOpen(modeling)}
              onEdit={() => handleEdit(modeling)}
              onDelete={() => handleDelete(modeling)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <ModelingFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        modeling={editingModeling}
        focusId={selectedFocusId}
      />
    </div>
  );
}