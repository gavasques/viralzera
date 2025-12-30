import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Folder, FolderPlus, MoreHorizontal, Pencil, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function FolderSidebar({ selectedFolderId, onSelectFolder }) {
  const queryClient = useQueryClient();
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const { data: folders = [] } = useQuery({
    queryKey: ['promptFolders'],
    queryFn: () => base44.entities.PromptFolder.list('name', 100),
  });

  const createMutation = useMutation({
    mutationFn: (name) => base44.entities.PromptFolder.create({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promptFolders'] });
      setNewFolderName('');
      setIsCreating(false);
      toast.success('Pasta criada!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => base44.entities.PromptFolder.update(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promptFolders'] });
      setEditingId(null);
      toast.success('Pasta atualizada!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PromptFolder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promptFolders'] });
      if (selectedFolderId === deleteMutation.variables) {
        onSelectFolder('all');
      }
      toast.success('Pasta excluída!');
    }
  });

  const handleCreate = () => {
    if (newFolderName.trim()) {
      createMutation.mutate(newFolderName.trim());
    }
  };

  const handleStartEdit = (folder) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  };

  const handleSaveEdit = (id) => {
    if (editName.trim()) {
      updateMutation.mutate({ id, name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="w-64 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-slate-700 text-sm">Pastas</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All prompts */}
          <button
            onClick={() => onSelectFolder('all')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
              selectedFolderId === 'all' ? 'bg-pink-50 text-pink-700' : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Todos os Prompts</span>
          </button>

          {/* Uncategorized */}
          <button
            onClick={() => onSelectFolder(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
              selectedFolderId === null ? 'bg-pink-50 text-pink-700' : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span className="text-sm">Sem Pasta</span>
          </button>

          {/* Folders */}
          {folders.map(folder => (
            <div
              key={folder.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                selectedFolderId === folder.id ? 'bg-pink-50 text-pink-700' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              {editingId === folder.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleSaveEdit(folder.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(folder.id)}
                  className="h-7 text-sm"
                  autoFocus
                />
              ) : (
                <>
                  <button
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <Folder className="w-4 h-4 shrink-0" />
                    <span className="text-sm truncate">{folder.name}</span>
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleStartEdit(folder)}>
                        <Pencil className="w-4 h-4 mr-2" /> Renomear
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(folder.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          ))}

          {/* New folder */}
          {isCreating ? (
            <div className="px-3 py-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={handleCreate}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Nome da pasta..."
                className="h-8 text-sm"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              <span className="text-sm">Nova Pasta</span>
            </button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}