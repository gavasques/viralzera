import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  FileText, 
  Plus, 
  Trash2, 
  Pin,
  PinOff,
  Clock,
  Sparkles,
  ArrowUpRight,
  Search
} from "lucide-react";
import { useSelectedFocus } from "@/components/hooks/useSelectedFocus";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

export default function CanvasSidePanel({ isOpen, onClose, initialCanvasId }) {
  const queryClient = useQueryClient();
  const [selectedCanvasId, setSelectedCanvasId] = useState(initialCanvasId || null);
  const [isListView, setIsListView] = useState(!initialCanvasId);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { selectedFocusId } = useSelectedFocus();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const createMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.Canvas.create({
        title: "Nova Nota",
        content: "",
        source: "manual",
        focus_id: selectedFocusId
      });
    },
    onSuccess: (newCanvas) => {
      queryClient.invalidateQueries({ queryKey: ['canvas-items'] });
      setSelectedCanvasId(newCanvas.id);
      setIsListView(false);
      setIsEditing(true);
      toast.success("Nova nota criada");
    }
  });

  // Fetch canvas items with pagination
  const { data: canvasItems = [], isLoading } = useQuery({
    queryKey: ['canvas-items', currentPage],
    queryFn: () => base44.entities.Canvas.filter({}, '-created_date', ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE),
    keepPreviousData: true,
  });

  // Fetch single selected canvas if not in current list (for direct access/editing)
  const { data: specificCanvas } = useQuery({
    queryKey: ['canvas-item', selectedCanvasId],
    queryFn: () => base44.entities.Canvas.get(selectedCanvasId),
    enabled: !!selectedCanvasId && !canvasItems.find(c => c.id === selectedCanvasId),
  });

  // Combine to find selected canvas
  const selectedCanvas = canvasItems.find(c => c.id === selectedCanvasId) || specificCanvas;

  // Update local state when canvas changes
  useEffect(() => {
    if (selectedCanvas) {
      setEditedContent(selectedCanvas.content || "");
      setEditedTitle(selectedCanvas.title || "");
      setHasChanges(false);
    }
  }, [selectedCanvas?.id]);

  // Open specific canvas when initialCanvasId changes
  useEffect(() => {
    if (initialCanvasId) {
      setSelectedCanvasId(initialCanvasId);
      setIsListView(false);
    }
  }, [initialCanvasId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.Canvas.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-items'] });
      setHasChanges(false);
      toast.success("Salvo!");
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Canvas.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-items'] });
      setSelectedCanvasId(null);
      setIsListView(true);
      toast.success("Canvas excluído");
    }
  });

  // Toggle pin mutation
  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }) => {
      return base44.entities.Canvas.update(id, { is_pinned: !isPinned });
    },
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

  const handleSendToKanban = () => {
    if (!selectedFocusId) {
      toast.error("Selecione um foco primeiro");
      return;
    }
    sendToKanbanMutation.mutate({
      focus_id: selectedFocusId,
      title: editedTitle,
      content: editedContent,
      status: 'idea'
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!selectedCanvasId) return;
    saveMutation.mutate({
      id: selectedCanvasId,
      data: { title: editedTitle, content: editedContent }
    });
  };

  const handleContentChange = (value) => {
    setEditedContent(value);
    setHasChanges(true);
  };

  const handleTitleChange = (value) => {
    setEditedTitle(value);
    setHasChanges(true);
  };

  const selectCanvas = (canvas) => {
    setSelectedCanvasId(canvas.id);
    setIsListView(false);
  };

  const charCount = editedContent?.length || 0;

  // Filter and sort items
  const filteredItems = canvasItems.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) || 
      item.content?.toLowerCase().includes(query)
    );
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_date) - new Date(a.created_date);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 shrink-0 bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-2">
          {!isListView && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsListView(true)}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <FileText className="w-4 h-4 text-indigo-600" />
          <span className="font-semibold text-slate-800">Canvas</span>
        </div>
        <div className="flex items-center gap-1">
          {isListView && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => createMutation.mutate()} 
              disabled={createMutation.isPending}
              className="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
              title="Nova Nota"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isListView ? (
        // List View
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar notas..."
                className="pl-9 h-9 bg-white border-slate-200"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-slate-400">Carregando...</div>
              ) : sortedItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">
                    {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum canvas ainda'}
                  </p>
                  {!searchQuery && (
                    <p className="text-xs text-slate-400 mt-1">
                      Envie conteúdo do Gerador de Scripts
                    </p>
                  )}
                </div>
              ) : (
                sortedItems.map((canvas) => (
                  <div
                    key={canvas.id}
                    onClick={() => selectCanvas(canvas)}
                    className="p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {canvas.is_pinned && (
                            <Pin className="w-3 h-3 text-indigo-500 shrink-0" />
                          )}
                          <h4 className="font-medium text-sm text-slate-800 truncate">
                            {canvas.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {canvas.content?.substring(0, 100)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {canvas.content?.length || 0} chars
                          </Badge>
                          {canvas.source === 'script_generator' && (
                            <Badge className="text-[10px] h-5 bg-indigo-100 text-indigo-700">
                              <Sparkles className="w-2.5 h-2.5 mr-1" />
                              Script
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinMutation.mutate({ id: canvas.id, isPinned: canvas.is_pinned });
                          }}
                        >
                          {canvas.is_pinned ? (
                            <PinOff className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Pin className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {format(new Date(canvas.created_date), "dd MMM, HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
             <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-xs h-8"
             >
                <ChevronLeft className="w-3 h-3 mr-1" /> Anterior
             </Button>
             <span className="text-xs text-slate-500 font-medium">
                Página {currentPage}
             </span>
             <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={canvasItems.length < ITEMS_PER_PAGE}
                className="text-xs h-8"
             >
                Próximo <ChevronRight className="w-3 h-3 ml-1" />
             </Button>
          </div>
        </div>
      ) : (
        // Editor View
        <>
          <div className="p-4 border-b border-slate-100 space-y-3">
            <Input
              value={editedTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Título do canvas"
              className="font-medium border-0 shadow-none px-0 text-lg focus-visible:ring-0 h-auto"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="bg-slate-100 px-2 py-1 rounded-md font-medium">
                  {charCount.toLocaleString()} caracteres
                </span>
                {selectedCanvas?.source === 'script_generator' && (
                  <Badge className="bg-indigo-100 text-indigo-700">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    Via Script
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => togglePinMutation.mutate({ 
                    id: selectedCanvasId, 
                    isPinned: selectedCanvas?.is_pinned 
                  })}
                >
                  {selectedCanvas?.is_pinned ? (
                    <PinOff className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <Pin className="w-4 h-4 text-slate-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteMutation.mutate(selectedCanvasId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Seu conteúdo aqui..."
                className="min-h-[400px] border-0 shadow-none resize-none focus-visible:ring-0 text-sm leading-relaxed font-mono"
                autoFocus
              />
            ) : (
              <div 
                className="prose prose-sm prose-slate max-w-none min-h-[400px]"
              >
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-slate-900" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 text-slate-900" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base font-bold mt-3 mb-2 text-slate-800" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 text-slate-700 leading-relaxed" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                    em: ({node, ...props}) => <em className="italic" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="text-slate-700" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-300 pl-4 my-3 italic text-slate-600 bg-slate-50 py-2 rounded-r" {...props} />,
                    code: ({node, inline, ...props}) => inline 
                      ? <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-700" {...props} />
                      : <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-sm"><code {...props} /></pre>,
                    hr: ({node, ...props}) => <hr className="my-4 border-slate-200" {...props} />,
                  }}
                >
                  {editedContent || "*Clique para editar...*"}
                </ReactMarkdown>
              </div>
            )}
          </ScrollArea>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <Button
              variant="outline"
              onClick={handleSendToKanban}
              className="gap-2"
              title="Enviar para o Kanban"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedContent(selectedCanvas?.content || "");
                    setIsEditing(false);
                    setHasChanges(false);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleSave();
                    setIsEditing(false);
                  }}
                  disabled={!hasChanges || saveMutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                Editar
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}