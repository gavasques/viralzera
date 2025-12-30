import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StickyNote, Plus, Trash2, Loader2, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CanvasNotesPanel({ canvasId }) {
  const [newNote, setNewNote] = useState("");
  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['canvasNotes', canvasId],
    queryFn: () => base44.entities.CanvasNote.filter({ canvas_id: canvasId }, '-created_date', 100),
    enabled: !!canvasId
  });

  // Create note mutation
  const createMutation = useMutation({
    mutationFn: (content) => base44.entities.CanvasNote.create({
      canvas_id: canvasId,
      content
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvasNotes', canvasId] });
      setNewNote("");
      toast.success("Nota adicionada!");
    }
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CanvasNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvasNotes', canvasId] });
      toast.success("Nota removida!");
    }
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createMutation.mutate(newNote);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <div className="flex flex-col h-full bg-yellow-50/30">
      {/* Header */}
      <div className="p-3 border-b border-yellow-100 bg-yellow-50/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-yellow-700 font-medium text-sm">
          <StickyNote className="w-4 h-4" />
          Anotações ({notes.length})
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-600/50" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-10 text-yellow-700/50 text-sm">
            <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Nenhuma anotação ainda.</p>
            <p className="text-xs mt-1">Escreva algo abaixo para começar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-yellow-100/50 p-3 rounded-lg border border-yellow-200/60 group relative">
                <p className="text-sm text-yellow-900 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-yellow-200/40">
                  <span className="text-[10px] text-yellow-700/60">
                    {format(new Date(note.created_date), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <button 
                    onClick={() => deleteMutation.mutate(note.id)}
                    className="text-yellow-700/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir nota"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-yellow-100 bg-yellow-50/50 shrink-0">
        <div className="relative">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua nota..."
            className="min-h-[80px] resize-none pr-12 bg-white border-yellow-200 focus-visible:ring-yellow-400 focus-visible:border-yellow-400 placeholder:text-yellow-700/30"
          />
          <div className="absolute bottom-2 right-2">
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNote.trim() || createMutation.isPending}
              className="h-7 w-7 p-0 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}