import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileText, Search, Plus, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { CardGridSkeleton } from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import DossierCard from "@/components/dossiers/DossierCard";
import DossierViewerModal from "@/components/dossiers/DossierViewerModal";

export default function ContentDossiers() {
  console.log('🔍 ContentDossiers renderizando...');
  
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingDossier, setViewingDossier] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  console.log('📍 Focus selecionado:', selectedFocusId);

  // Fetch all dossiers (simpler approach)
  const { data: allDossiers = [], isLoading: loadingDossiers } = useQuery({
    queryKey: ['contentDossiers'],
    queryFn: async () => {
      console.log('📦 Buscando dossiês...');
      const dossiers = await neon.entities.ContentDossier.list('-created_date', 200);
      console.log('✅ Dossiês encontrados:', dossiers.length);
      return dossiers;
    }
  });

  // Fetch modelings to enrich dossiers
  const { data: modelings = [], isLoading: loadingModelings } = useQuery({
    queryKey: ['modelings', selectedFocusId],
    queryFn: async () => {
      if (!selectedFocusId) return [];
      console.log('📦 Buscando modelagens para focus:', selectedFocusId);
      const mods = await neon.entities.Modeling.filter({ focus_id: selectedFocusId }, '-created_date', 200);
      console.log('✅ Modelagens encontradas:', mods.length);
      return mods;
    },
    enabled: !!selectedFocusId
  });

  const isLoading = loadingModelings || loadingDossiers;

  // Filter dossiers by focus
  const dossiers = React.useMemo(() => {
    if (!selectedFocusId) return allDossiers;
    const modelingIds = modelings.map(m => m.id);
    return allDossiers.filter(d => modelingIds.includes(d.modeling_id));
  }, [allDossiers, modelings, selectedFocusId]);

  console.log('📊 Stats:', { 
    total: allDossiers.length, 
    filtered: dossiers.length, 
    modelings: modelings.length,
    isLoading 
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => neon.entities.ContentDossier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentDossiers'] });
      toast.success('Dossiê excluído!');
    }
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => neon.entities.ContentDossier.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentDossiers'] });
      toast.success('Status atualizado!');
    }
  });

  // Enrich dossiers with modeling info
  const enrichedDossiers = dossiers.map(d => ({
    ...d,
    modeling: modelings.find(m => m.id === d.modeling_id)
  }));

  // Filter dossiers
  const filteredDossiers = enrichedDossiers.filter(d => {
    if (!searchTerm) return true;
    const modelingTitle = d.modeling?.title?.toLowerCase() || '';
    return modelingTitle.includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredDossiers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDossiers = filteredDossiers.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDelete = (id) => {
    if (confirm('Excluir este dossiê permanentemente?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleUseForScript = (dossierId) => {
    window.location.href = createPageUrl('YoutubeScripts') + `?action=new&dossierId=${dossierId}`;
  };

  const handleToggleActive = (dossier) => {
    const newStatus = !dossier.is_active;
    toggleActiveMutation.mutate({ id: dossier.id, is_active: newStatus });
  };

  if (!selectedFocusId) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Selecione um foco para ver os dossiês</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-purple-600" />
            Dossiês de Conteúdo
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Documentos organizados gerados a partir das suas modelagens
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por modelagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-slate-500">
          {filteredDossiers.length} dossiê(s)
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <CardGridSkeleton count={6} columns={1} />
      ) : filteredDossiers.length === 0 ? (
        searchTerm ? (
          <EmptyState
            icon={Search}
            title="Nenhum dossiê encontrado"
            description="Tente buscar por outro termo"
          />
        ) : (
          <EmptyState
            icon={FileText}
            title="Nenhum dossiê criado"
            description="Crie modelagens e gere dossiês a partir delas"
            actionLabel="Ir para Modelagens"
            onAction={() => window.location.href = createPageUrl('Modelagem')}
          />
        )
      ) : (
        <>
          <div className="space-y-3">
            {paginatedDossiers.map(dossier => (
              <DossierCard
                key={dossier.id}
                dossier={dossier}
                onView={() => setViewingDossier(dossier)}
                onDelete={() => handleDelete(dossier.id)}
                onUseForScript={() => handleUseForScript(dossier.id)}
                onToggleActive={() => handleToggleActive(dossier)}
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
                    className={currentPage === page ? "bg-purple-600 hover:bg-purple-700" : ""}
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

      {/* Viewer Modal */}
      <DossierViewerModal
        open={!!viewingDossier}
        onOpenChange={() => setViewingDossier(null)}
        dossier={viewingDossier}
      />
    </div>
  );
}