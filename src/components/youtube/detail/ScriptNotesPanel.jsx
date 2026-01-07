import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  StickyNote, 
  Loader2,
  X,
  Check
} from "lucide-react";
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

const NOTE_COLORS = {
  yellow: "bg-yellow-50 border-yellow-200 hover:border-yellow-300",
  blue: "bg-blue-50 border-blue-200 hover:border-blue-300",
  green: "bg-green-50 border-green-200 hover:border-green-300",
  red: "bg-red-50 border-red-200 hover:border-red-300",
  purple: "bg-purple-50 border-purple-200 hover:border-purple-300",
};

const NOTE_DOT_COLORS = {
  yellow: "bg-yellow-400",
  blue: "bg-blue-400",
  green: "bg-green-400",
  red: "bg-red-400",
  purple: "bg-purple-400",
};

export default function ScriptNotesPanel({ 
  scriptId, 
  isOpen, 
  pendingNote, 
  onNoteCreated,
  activeNoteId,
  onUpdateHighlightColor // callback to update highlight color in editor
}) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  
  // Auto-focus and prep for new note when pendingNote changes
  React.useEffect(() => {
    if (pendingNote) {
      // Set color from pending note if available
      if (pendingNote.color) {
        setSelectedColor(pendingNote.color);
      }
      // Focus textarea
      const textarea = document.querySelector('textarea[placeholder="Adicionar uma nota..."]');
      if (textarea) textarea.focus();
    }
  }, [pendingNote]);

  // Scroll to active note when activeNoteId changes
  React.useEffect(() => {
    if (activeNoteId && isOpen) {
      setTimeout(() => {
        const element = document.getElementById(`note-${activeNoteId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [activeNoteId, isOpen]);

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['script-notes', scriptId],
    queryFn: () => base44.entities.ScriptNote.filter({ script_id: scriptId }, 'created_date'),
    enabled: !!scriptId && isOpen
  });

  // Create note
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ScriptNote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-notes', scriptId] });
      setNewNote('');
      toast.success('Nota adicionada');
      if (onNoteCreated) onNoteCreated();
    }
  });

  // Update note
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ScriptNote.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-notes', scriptId] });
      setEditingId(null);
      toast.success('Nota atualizada');
    }
  });

  // Delete note
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScriptNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['script-notes', scriptId] });
      toast.success('Nota removida');
    }
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const noteData = {
      script_id: scriptId,
      note: newNote.trim(),
      color: selectedColor
    };

    if (pendingNote) {
      noteData.data_id = pendingNote.id;
      noteData.quote = pendingNote.quote;
      console.log('Creating note with data_id:', pendingNote.id, 'quote:', pendingNote.quote);
    }

    createMutation.mutate(noteData);
  };

  const handleStartEdit = (note) => {
    setEditingId(note.id);
    setEditingText(note.note);
  };

  const handleSaveEdit = (noteId) => {
    if (!editingText.trim()) return;
    updateMutation.mutate({ id: noteId, data: { note: editingText.trim() } });
  };

  const handleDeleteClick = (note) => {
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteMutation.mutate(noteToDelete.id);
    }
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  if (!isOpen) return null;

  return (
    <div className="border-l border-slate-200 bg-slate-50/50 w-80 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-slate-900 text-sm">Notas Internas</h3>
          <span className="text-xs text-slate-400 ml-auto">{notes.length}</span>
        </div>
        
        {/* Add new note */}
        <div className="space-y-2">
          {pendingNote && (
            <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 italic mb-2 border-l-2 border-l-amber-400">
              "{(pendingNote.quote.length > 50 ? pendingNote.quote.substring(0, 50) + '...' : pendingNote.quote)}"
            </div>
          )}
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={pendingNote ? "Escreva a nota sobre o trecho selecionado..." : "Adicionar uma nota..."}
            className="min-h-[60px] text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {pendingNote && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNewNote('');
                    if (onNoteCreated) onNoteCreated(); // Clear pending note
                  }}
                  className="h-6 px-2 text-[10px] text-slate-400 hover:text-red-500 mr-2"
                >
                  Cancelar seleção
                </Button>
              )}
              {Object.keys(NOTE_COLORS).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    NOTE_DOT_COLORS[color]
                  } ${selectedColor === color ? 'ring-2 ring-offset-1 ring-slate-400' : 'opacity-60 hover:opacity-100'}`}
                />
              ))}
            </div>
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNote.trim() || createMutation.isPending}
              className="h-7 text-xs bg-amber-500 hover:bg-amber-600"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Nenhuma nota ainda</p>
              <p className="text-xs mt-1">Adicione notas para lembrar de pontos importantes</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg border transition-all ${NOTE_COLORS[note.color || 'yellow']} ${
                  activeNoteId === note.data_id ? 'ring-2 ring-offset-2 ring-amber-400 shadow-md transform scale-[1.02]' : ''
                }`}
                id={`note-${note.data_id}`}
              >
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="min-h-[60px] text-sm resize-none bg-white"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {note.quote && (
                      <div className="mb-2 pb-2 border-b border-black/5 text-xs text-slate-500 italic">
                        "{note.quote.length > 80 ? note.quote.substring(0, 80) + '...' : note.quote}"
                      </div>
                    )}
                    <p 
                      className="text-sm text-slate-700 whitespace-pre-wrap cursor-pointer font-medium"
                      onClick={() => handleStartEdit(note)}
                    >
                      {note.note}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50">
                      <span className="text-[10px] text-slate-400">
                        {new Date(note.created_date).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 text-slate-400 hover:text-red-500"
                        onClick={() => handleDeleteClick(note)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}