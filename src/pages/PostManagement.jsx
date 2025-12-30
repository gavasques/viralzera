import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Lightbulb, PenLine, CheckCircle, Calendar, Rocket,
  MoreHorizontal, Clock, Tag, Users, GripVertical, FileText
} from "lucide-react";
import { toast } from "sonner";
import PostCardModal from "@/components/posts/PostCardModal";
import CanvasToggleButton from "@/components/canvas/CanvasToggleButton";
import PostFilters from "@/components/posts/PostFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLUMNS = [
  { id: 'idea', title: 'Ideias', icon: Lightbulb, color: 'bg-amber-500', bgLight: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'writing', title: 'Em Criação', icon: PenLine, color: 'bg-blue-500', bgLight: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'review', title: 'Revisão', icon: CheckCircle, color: 'bg-purple-500', bgLight: 'bg-purple-50', borderColor: 'border-purple-200' },
  { id: 'scheduled', title: 'Agendado', icon: Calendar, color: 'bg-indigo-500', bgLight: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { id: 'published', title: 'Publicado', icon: Rocket, color: 'bg-emerald-500', bgLight: 'bg-emerald-50', borderColor: 'border-emerald-200' },
];

const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Média', color: 'bg-amber-100 text-amber-700' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
};

const PLATFORMS = ['Instagram', 'TikTok', 'Twitter', 'LinkedIn', 'YouTube'];

export default function PostManagement() {
  const { selectedFocusId } = useSelectedFocus();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    post_type_id: "all",
    platform: "all",
    audience_id: "all"
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', selectedFocusId],
    queryFn: () => base44.entities.Post.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId
  });

  const { data: audiences = [] } = useQuery({
    queryKey: ['audiences', selectedFocusId],
    queryFn: () => base44.entities.Audience.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId
  });

  const { data: postTypes = [] } = useQuery({
    queryKey: ['postTypes', selectedFocusId],
    queryFn: () => base44.entities.PostType.filter({ focus_id: selectedFocusId }),
    enabled: !!selectedFocusId
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Post.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    updateMutation.mutate({
      id: draggableId,
      data: { status: newStatus }
    });

    toast.success(`Movido para "${COLUMNS.find(c => c.id === newStatus)?.title}"`);
  };

  const handleAddNew = (status = 'idea') => {
    setEditingPost({ status });
    setModalOpen(true);
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setModalOpen(true);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !filters.search || 
      post.title?.toLowerCase().includes(filters.search.toLowerCase()) || 
      post.content?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.status === 'all' || post.status === filters.status;
    const matchesType = filters.post_type_id === 'all' || post.post_type_id === filters.post_type_id;
    const matchesPlatform = filters.platform === 'all' || post.platform === filters.platform;
    const matchesAudience = filters.audience_id === 'all' || post.audience_id === filters.audience_id;

    return matchesSearch && matchesStatus && matchesType && matchesPlatform && matchesAudience;
  });

  const getPostsByStatus = (status) => {
    return filteredPosts.filter(p => p.status === status);
  };

  const getPostType = (id) => postTypes.find(pt => pt.id === id);

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
          <Button onClick={() => handleAddNew('idea')} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200">
            <Plus className="w-4 h-4 mr-2" />
            Nova Postagem
          </Button>
        </div>
      </div>

      <PostFilters
        filters={filters}
        setFilters={setFilters}
        postTypes={postTypes}
        audiences={audiences}
        platforms={PLATFORMS}
        statusOptions={COLUMNS}
      />

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(column => (
            <div 
              key={column.id} 
              className={`min-w-[280px] flex-1 flex flex-col rounded-xl border ${column.borderColor} ${column.bgLight}`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${column.color}`}>
                      <column.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800">{column.title}</span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-white/60">
                      {getPostsByStatus(column.id).length}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-slate-400 hover:text-slate-600"
                    onClick={() => handleAddNew(column.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Column Content */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div 
                    className="flex-1 p-2 overflow-y-auto"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className={`min-h-[200px] rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-white/50' : ''}`}>
                      {getPostsByStatus(column.id).map((post, index) => (
                        <Draggable key={post.id} draggableId={post.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                              className={`mb-2 ${snapshot.isDragging ? 'rotate-2 z-50' : ''}`}
                            >
                              <div 
                                className={`bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group relative ${snapshot.isDragging ? 'shadow-lg ring-2 ring-pink-200' : ''}`}
                                onClick={(e) => {
                                  // Prevent open modal if it was a drag action
                                  if (provided.dragHandleProps['data-drag-handle-id']) {
                                     // This check is tricky with dnd libraries, but usually onClick fires after drag end.
                                     // Let's rely on standard behavior or add a small check if needed.
                                     // Actually, hello-pangea/dnd prevents default onClick if drag occurred.
                                     handleEditPost(post);
                                  } else {
                                     handleEditPost(post);
                                  }
                                }}
                              >
                                {/* Visual Grip Icon (Always visible now for better UX) */}
                                <div className="absolute right-2 top-2 text-slate-300">
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                {/* Card Content */}
                                <h4 className="font-medium text-slate-800 text-sm mb-2 pr-6 line-clamp-2">
                                  {post.title}
                                </h4>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {post.post_type_id && (
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-slate-50">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {getPostType(post.post_type_id)?.title || 'Tipo'}
                                    </Badge>
                                  )}
                                  {post.priority && (
                                    <Badge className={`text-[10px] h-5 px-1.5 ${PRIORITY_CONFIG[post.priority].color}`}>
                                      {PRIORITY_CONFIG[post.priority].label}
                                    </Badge>
                                  )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between text-[11px] text-slate-400">
                                  {post.scheduled_date ? (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {format(new Date(post.scheduled_date), "dd MMM", { locale: ptBR })}
                                    </span>
                                  ) : (
                                    <span></span>
                                  )}
                                  {post.platform && (
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                      {post.platform}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modal */}
      <PostCardModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        post={editingPost}
        postTypes={postTypes}
        onSaved={() => {
          setModalOpen(false);
          setEditingPost(null);
          queryClient.invalidateQueries({ queryKey: ['posts'] });
        }}
      />
    </div>
  );
}