import React, { useState, useCallback } from 'react';
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import CanvasToggleButton from "@/components/canvas/CanvasToggleButton";
import PostFilters from "@/components/posts/PostFilters";
import KanbanBoard from "@/components/posts/KanbanBoard";
import PostCardModal from "@/components/posts/PostCardModal";
import { usePosts, useAudiences, usePostTypes, useUpdatePostStatus } from "@/components/posts/hooks/usePostsData";
import { usePostFilters } from "@/components/posts/hooks/usePostFilters";

export default function PostManagement() {
  const { selectedFocusId } = useSelectedFocus();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  // Data
  const { data: posts = [], isLoading } = usePosts(selectedFocusId);
  const { data: audiences = [] } = useAudiences(selectedFocusId);
  const { data: postTypes = [] } = usePostTypes(selectedFocusId);
  
  // Mutations
  const updateStatus = useUpdatePostStatus(selectedFocusId);
  
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
    updateStatus.mutate({ id: postId, status: newStatus });
  }, [updateStatus]);

  const handleAddNew = useCallback((status = 'idea') => {
    setEditingPost({ status });
    setModalOpen(true);
  }, []);

  const handleEditPost = useCallback((post) => {
    setEditingPost(post);
    setModalOpen(true);
  }, []);

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
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pink-600" />
            Gestão de Postagens
          </h1>
          <p className="text-slate-500 text-sm">Organize seu fluxo de criação de conteúdo</p>
        </div>
        <div className="flex items-center gap-2">
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
      <PostFilters
        filters={filters}
        setFilters={setFilters}
        postTypes={postTypes}
        audiences={audiences}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Kanban Board */}
      <KanbanBoard
        getPostsByStatus={getPostsByStatus}
        postTypes={postTypes}
        onDragEnd={handleDragEnd}
        onAddNew={handleAddNew}
        onEditPost={handleEditPost}
      />

      {/* Modal */}
      <PostCardModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        post={editingPost}
        postTypes={postTypes}
        onSaved={handleModalClose}
      />
    </div>
  );
}