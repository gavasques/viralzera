import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Eye, EyeOff, Video, Scissors, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import CanvasToggleButton from "@/components/canvas/CanvasToggleButton";
import PostFilters from "@/components/posts/PostFilters";
import KanbanBoard from "@/components/posts/KanbanBoard";
import PostCardModal from "@/components/posts/PostCardModal";
import ColumnFormModal from "@/components/posts/ColumnFormModal";
import { 
  usePosts, 
  usePostTypes, 
  useUpdatePostStatus, 
  useKanbanColumns,
  useInitializeColumns,
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
  useSavePost
} from "@/components/posts/hooks/usePostsData";
import { usePostFilters } from "@/components/posts/hooks/usePostFilters";
import { COLUMNS } from "@/components/posts/constants";

export default function PostManagement() {
  const { selectedFocusId } = useSelectedFocus();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  
  // Column Modal State
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [columnModalMode, setColumnModalMode] = useState('create'); // 'create' or 'edit'
  const [editingColumn, setEditingColumn] = useState(null);

  // Data
  const { data: posts = [], isLoading, refetch: refetchPosts, isRefetching } = usePosts(selectedFocusId);
  const { data: postTypes = [] } = usePostTypes(selectedFocusId);
  const { data: columnsData = [], isLoading: isLoadingColumns } = useKanbanColumns(selectedFocusId);
  
  // Mutations
  const updateStatus = useUpdatePostStatus(selectedFocusId);
  const initColumns = useInitializeColumns(selectedFocusId);
  const createColumn = useCreateColumn(selectedFocusId);
  const updateColumn = useUpdateColumn(selectedFocusId);
  const deleteColumn = useDeleteColumn(selectedFocusId);
  const savePost = useSavePost(selectedFocusId);
  
  // Initialize columns if empty
  useEffect(() => {
    if (selectedFocusId && !isLoadingColumns && columnsData.length === 0) {
      initColumns.mutate();
    }
  }, [selectedFocusId, isLoadingColumns, columnsData.length]);

  // Merge dynamic columns with icon components
  const columns = useMemo(() => {
    if (columnsData.length === 0) return COLUMNS; // Fallback while loading or init
    
    return columnsData
      .sort((a, b) => a.order - b.order)
      .map(col => {
        // Find matching default column to get icon/colors if available (fallback)
        const defaultCol = COLUMNS.find(c => c.id === col.slug) || {};
        
        let icon = defaultCol.icon;
        if (!icon) {
          const titleLower = col.title?.toLowerCase() || '';
          if (titleLower.includes('gravar')) icon = Video;
          else if (titleLower.includes('edição') || titleLower.includes('edicao')) icon = Scissors;
        }

        return {
          ...defaultCol, // defaults
          ...col,        // override with DB data
          icon: icon || col.icon, // use calculated icon or existing one
          id: col.id,    // ensure DB ID is used
          slug: col.slug || col.id // slug for status mapping
        };
      });
  }, [columnsData]);

  // Filters
  const { 
    filters, 
    setFilters, 
    getPostsByStatus,
    clearFilters,
    hasActiveFilters
  } = usePostFilters(posts);

  // Handlers
  const handleDragEnd = useCallback((postId, newStatus) => {
    // newStatus is the column ID or slug
    // We need to pass the correct status string the post entity expects
    // If our columns use slugs matching post status, just use newStatus
    updateStatus.mutate({ id: postId, status: newStatus });
  }, [updateStatus]);

  const handleColumnDragEnd = useCallback((sourceIndex, destIndex) => {
    const newColumns = [...columns];
    const [removed] = newColumns.splice(sourceIndex, 1);
    newColumns.splice(destIndex, 0, removed);

    // Update orders
    newColumns.forEach((col, index) => {
      if (col.order !== index) {
        updateColumn.mutate({ id: col.id, data: { order: index } });
      }
    });
  }, [columns, updateColumn]);

  const handleAddNew = useCallback((status = 'idea') => {
    setEditingPost({ status });
    setModalOpen(true);
  }, []);

  const handleEditPost = useCallback((post) => {
    setEditingPost(post);
    setModalOpen(true);
  }, []);

  const handleAddColumn = useCallback(() => {
    setColumnModalMode('create');
    setEditingColumn(null);
    setColumnModalOpen(true);
  }, []);

  const handleRenameColumn = useCallback((column) => {
    setColumnModalMode('edit');
    setEditingColumn(column);
    setColumnModalOpen(true);
  }, []);

  const handleColumnModalConfirm = useCallback((title) => {
    if (columnModalMode === 'create') {
      createColumn.mutate({
        title,
        order: columns.length,
        slug: crypto.randomUUID(),
        color: 'bg-slate-500'
      });
    } else if (columnModalMode === 'edit' && editingColumn) {
      if (title !== editingColumn.title) {
        updateColumn.mutate({ id: editingColumn.id, data: { title } });
      }
    }
    setColumnModalOpen(false);
  }, [columnModalMode, editingColumn, createColumn, updateColumn, columns.length]);

  const handleDeleteColumn = useCallback((column) => {
    if (confirm(`Tem certeza que deseja excluir a coluna "${column.title}"?`)) {
      deleteColumn.mutate(column.id);
    }
  }, [deleteColumn]);

  const handleToggleComplete = useCallback((post, isCompleted) => {
    savePost.mutate({ 
      id: post.id, 
      data: { is_completed: isCompleted !== undefined ? isCompleted : !post.is_completed } 
    });
  }, [savePost]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditingPost(null);
  }, []);

  if (!selectedFocusId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-slate-500">Selecione um foco para gerenciar postagens.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pink-600" />
            Gestão de Postagens
          </h1>
          <p className="text-slate-500 text-sm">Organize seu fluxo de criação de conteúdo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetchPosts()}
            className="text-slate-500 hover:text-slate-700"
            disabled={isRefetching}
            title="Atualizar dados"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <CanvasToggleButton />
          <Button 
            onClick={() => handleAddNew('idea')} 
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Postagem
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 shrink-0">
        <PostFilters
          filters={filters}
          setFilters={setFilters}
          postTypes={postTypes}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          className="w-full"
        />
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        columns={columns}
        getPostsByStatus={getPostsByStatus}
        postTypes={postTypes}
        onDragEnd={handleDragEnd}
        onColumnDragEnd={handleColumnDragEnd}
        onAddNew={handleAddNew}
        onEditPost={handleEditPost}
        onAddColumn={handleAddColumn}
        onDeleteColumn={handleDeleteColumn}
        onRenameColumn={handleRenameColumn}
        onToggleComplete={handleToggleComplete}
      />

      {/* Modal */}
      <PostCardModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        post={editingPost}
        postTypes={postTypes}
        onSaved={handleModalClose}
      />
      
      <ColumnFormModal
        isOpen={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
        onConfirm={handleColumnModalConfirm}
        initialTitle={editingColumn?.title || ""}
        mode={columnModalMode}
      />
    </div>
  );
}