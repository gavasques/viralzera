import React, { useState, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/common/PageHeader";
import { PageSkeleton } from "@/components/common/LoadingSkeleton";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import CanvasFolderSidebar from "@/components/canvas/CanvasFolderSidebar";
import CanvasCard from "@/components/canvas/CanvasCard";
import CanvasFormModal from "@/components/canvas/CanvasFormModal";
import CanvasEditorDialog from "@/components/canvas/CanvasEditorDialog";

const ITEMS_PER_PAGE = 12;

export default function Canvas() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("all");
  const [selectedCanvas, setSelectedCanvas] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCanvas, setEditingCanvas] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { selectedFocusId } = useSelectedFocus();

  const { data: canvasItems = [], isLoading } = useQuery({
    queryKey: ['canvas-items'],
    queryFn: () => base44.entities.Canvas.list('title', 200),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['canvasFolders'],
    queryFn: () => base44.entities.CanvasFolder.list('name', 100),
  });

  const folderMap = useMemo(() => {
    const map = {};
    folders.forEach(f => { map[f.id] = f.name; });
    return map;
  }, [folders]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Canvas.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-items'] });
      setIsEditing(false);
      toast.success("Salvo!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Canvas.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-items'] });
      setSelectedCanvas(null);
      toast.success("Canvas excluído");
    }
  });

  const togglePinMutation = useMutation({
    mutationFn: ({ id, isPinned }) => base44.entities.Canvas.update(id, { is_pinned: !isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-items'] });
    }
  });

  const sendToKanbanMutation = useMutation({
    mutationFn: (data) => base44.entities.Post.create(data),
    onSuccess: () => {
      toast.success("Enviado para o Kanban (Ideias)!");
    },
    onError: () => toast.error("Erro ao enviar para o Kanban")
  });

  const handleSendToKanban = (canvas) => {
    if (!selectedFocusId) {
      toast.error("Selecione um foco primeiro");
      return;
    }
    sendToKanbanMutation.mutate({
      focus_id: selectedFocusId,
      title: canvas.title,
      content: canvas.content,
      status: 'idea'
    });
  };

  const handleCopy = (content, id) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado!");
  };

  const handleEdit = (canvas) => {
    setSelectedCanvas(canvas);
    setIsEditing(true);
  };

  const handleSave = (data) => {
    if (!selectedCanvas) return;
    updateMutation.mutate({
      id: selectedCanvas.id,
      data: { 
        title: data.title, 
        content: data.content,
        folder_id: data.folder_id
      }
    });
  };

  const handleNew = () => {
    setEditingCanvas({ folder_id: selectedFolderId !== 'all' && selectedFolderId !== null ? selectedFolderId : null });
    setIsFormOpen(true);
  };

  // Filter canvas items
  const filteredItems = canvasItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFolder = selectedFolderId === "all" 
      ? true 
      : selectedFolderId === null 
        ? !item.folder_id 
        : item.folder_id === selectedFolderId;

    return matchesSearch && matchesFolder;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return a.title.localeCompare(b.title);
  });

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFolderId]);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      <CanvasFolderSidebar 
        selectedFolderId={selectedFolderId} 
        onSelectFolder={setSelectedFolderId} 
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-pink-600" />
              Canvas
            </h1>
            <p className="text-slate-500 text-sm mt-1">Seus rascunhos e conteúdos salvos</p>
          </div>
          <Button onClick={handleNew} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200">
            <Plus className="w-4 h-4 mr-2" /> Novo Canvas
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por título ou conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Grid */}
        {sortedItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-700">Nenhum canvas encontrado</h3>
            <p className="text-slate-500 text-sm mt-1">
              {searchTerm || selectedFolderId !== 'all' 
                ? "Tente ajustar os filtros de busca" 
                : "Crie um novo ou envie conteúdo do Gerador de Scripts"}
            </p>
            <Button onClick={handleNew} className="mt-4" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Criar Canvas
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedItems.map((canvas) => (
                <CanvasCard 
                  key={canvas.id} 
                  canvas={canvas}
                  folderName={folderMap[canvas.folder_id]}
                  onClick={() => handleEdit(canvas)}
                  onSendToKanban={handleSendToKanban}
                  onCopy={handleCopy}
                  onTogglePin={(c) => togglePinMutation.mutate({ id: c.id, isPinned: c.is_pinned })}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 p-0 ${currentPage === page ? 'bg-pink-500 hover:bg-pink-600' : ''}`}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <span className="text-sm text-slate-500 ml-2">
                  {sortedItems.length} itens
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <CanvasFormModal 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        canvas={editingCanvas}
      />

      {/* Edit Dialog */}
      <CanvasEditorDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        canvas={selectedCanvas}
        onSave={handleSave}
        onSendToKanban={handleSendToKanban}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}