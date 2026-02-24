import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Youtube, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";
import YoutubeScriptCard from "@/components/youtube/YoutubeScriptCard";
import YoutubeScriptWizardModal from "@/components/youtube/wizard/YoutubeScriptWizardModal";

export default function YoutubeScripts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedFocusId } = useSelectedFocus();
  const [showWizard, setShowWizard] = useState(false);
  const [dossierId, setDossierId] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoriaFilter, setCategoriaFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (scriptId) => {
      // Delete associated chats first
      const chats = await neon.entities.YoutubeScriptChat.filter({ script_id: scriptId });
      await Promise.all(chats.map(c => neon.entities.YoutubeScriptChat.delete(c.id)));
      // Delete script
      await neon.entities.YoutubeScript.delete(scriptId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-scripts'] });
      toast.success('Roteiro excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir roteiro: ' + error.message);
    }
  });

  // Check URL params for wizard trigger
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const dossier = urlParams.get('dossierId');
    
    if (action === 'new') {
      setDossierId(dossier);
      setShowWizard(true);
    }
  }, []);

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['youtube-scripts', selectedFocusId],
    queryFn: () => neon.entities.YoutubeScript.filter({ focus_id: selectedFocusId }, '-created_date', 100),
    enabled: !!selectedFocusId,
  });

  const handleNew = () => {
    setShowWizard(true);
  };

  const handleCardClick = (script) => {
    navigate(createPageUrl(`YoutubeScriptDetail?id=${script.id}`));
  };

  // Filter scripts
  const filteredScripts = useMemo(() => {
    return scripts.filter(script => {
      const matchesSearch = !searchTerm || 
        script.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.hook?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || script.status === statusFilter;
      const matchesCategoria = categoriaFilter === 'all' || script.categoria === categoriaFilter;
      
      return matchesSearch && matchesStatus && matchesCategoria;
    });
  }, [scripts, searchTerm, statusFilter, categoriaFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredScripts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedScripts = filteredScripts.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoriaFilter]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Roteiros para YouTube" 
        subtitle="Crie e gerencie seus roteiros de vídeos"
        icon={Youtube}
        actions={
          <Button 
            onClick={handleNew} 
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-200"
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Roteiro
          </Button>
        }
      />

      {/* Filters */}
      {scripts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por título ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Rascunho">Rascunho</SelectItem>
                <SelectItem value="Roteiro Pronto">Roteiro Pronto</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>

            {/* Categoria Filter */}
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="Amazon">Amazon</SelectItem>
                <SelectItem value="Importação">Importação</SelectItem>
                <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                <SelectItem value="Gestão">Gestão</SelectItem>
                <SelectItem value="Dubai">Dubai</SelectItem>
                <SelectItem value="Marketplaces">Marketplaces</SelectItem>
                <SelectItem value="Economia">Economia</SelectItem>
                <SelectItem value="Genérico">Genérico</SelectItem>
                <SelectItem value="Inteligência Artificial">Inteligência Artificial</SelectItem>
                <SelectItem value="Parcerias">Parcerias</SelectItem>
                <SelectItem value="Aulas">Aulas</SelectItem>
                <SelectItem value="Política">Política</SelectItem>
                <SelectItem value="Mercado Livre">Mercado Livre</SelectItem>
                <SelectItem value="Shopee">Shopee</SelectItem>
                <SelectItem value="Tiktok Shop">Tiktok Shop</SelectItem>
                <SelectItem value="Afiliados">Afiliados</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-slate-500 flex items-center">
              {filteredScripts.length} roteiro(s)
            </div>
          </div>
        </div>
      )}

      {filteredScripts.length === 0 && scripts.length === 0 ? (
        <EmptyState 
          icon={Youtube}
          title="Nenhum roteiro criado ainda"
          description="Comece criando seu primeiro roteiro de vídeo para o YouTube"
          actionLabel="Criar Primeiro Roteiro"
          onAction={handleNew}
        />
      ) : filteredScripts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">Nenhum roteiro encontrado com os filtros aplicados.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedScripts.map((script) => (
              <YoutubeScriptCard 
                key={script.id} 
                script={script} 
                onClick={() => handleCardClick(script)}
                onDelete={(id) => deleteMutation.mutateAsync(id)}
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
                    className={currentPage === page ? "bg-red-600 hover:bg-red-700" : ""}
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

      <YoutubeScriptWizardModal 
        open={showWizard} 
        onOpenChange={setShowWizard}
        initialDossierId={dossierId}
      />
    </div>
  );
}