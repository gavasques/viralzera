import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, FolderPlus, MoreVertical, Pencil, Trash2, FolderOpen, Layers, Archive } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function CanvasFolderSidebar({ selectedFolderId, onSelectFolder }) {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [folderName, setFolderName] = useState('');

    const { data: rawFolders = [] } = useQuery({
        queryKey: ['canvasFolders'],
        queryFn: () => base44.entities.CanvasFolder.list('name', 100),
    });

    const folders = React.useMemo(() => {
        return [...rawFolders].sort((a, b) => a.name.localeCompare(b.name));
    }, [rawFolders]);

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.CanvasFolder.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['canvasFolders'] });
            toast.success('Pasta criada!');
            setIsCreateOpen(false);
            setFolderName('');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.CanvasFolder.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['canvasFolders'] });
            toast.success('Pasta atualizada!');
            setEditingFolder(null);
            setFolderName('');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.CanvasFolder.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['canvasFolders'] });
            toast.success('Pasta excluída!');
            if (selectedFolderId === editingFolder?.id) onSelectFolder('all');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!folderName.trim()) return;

        if (editingFolder) {
            updateMutation.mutate({ id: editingFolder.id, data: { name: folderName } });
        } else {
            createMutation.mutate({ name: folderName });
        }
    };

    const handleEdit = (folder) => {
        setEditingFolder(folder);
        setFolderName(folder.name);
        setIsCreateOpen(true);
    };

    const handleDelete = (folder) => {
        if (confirm('Tem certeza que deseja excluir esta pasta?')) {
            deleteMutation.mutate(folder.id);
        }
    };

    return (
        <div className="w-64 shrink-0 border-r border-slate-200 bg-white h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-700 text-sm">Pastas</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => {
                    setEditingFolder(null);
                    setFolderName('');
                    setIsCreateOpen(true);
                }}>
                    <FolderPlus className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <button
                    onClick={() => onSelectFolder('all')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedFolderId === 'all' 
                        ? 'bg-pink-50 text-pink-700 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    Todos os Canvas
                </button>
                <button
                    onClick={() => onSelectFolder(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedFolderId === null 
                        ? 'bg-pink-50 text-pink-700 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <FolderOpen className="w-4 h-4" />
                    Sem Pasta
                </button>
                <button
                    onClick={() => onSelectFolder('archived')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedFolderId === 'archived' 
                        ? 'bg-amber-50 text-amber-700 font-medium' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    <Archive className="w-4 h-4" />
                    Arquivados
                </button>

                <div className="h-px bg-slate-100 my-2 mx-2" />

                {folders.map(folder => (
                    <div 
                        key={folder.id}
                        className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                            selectedFolderId === folder.id 
                            ? 'bg-indigo-50 text-indigo-700 font-medium' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                        onClick={() => onSelectFolder(folder.id)}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Folder className={`w-4 h-4 ${selectedFolderId === folder.id ? 'fill-indigo-200' : 'fill-slate-100'}`} />
                            <span className="truncate">{folder.name}</span>
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/5 rounded transition-opacity">
                                    <MoreVertical className="w-3 h-3" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(folder)}>
                                    <Pencil className="w-3 h-3 mr-2" /> Renomear
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(folder)} className="text-red-600">
                                    <Trash2 className="w-3 h-3 mr-2" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFolder ? 'Renomear Pasta' : 'Nova Pasta'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input 
                            placeholder="Nome da pasta" 
                            value={folderName}
                            onChange={e => setFolderName(e.target.value)}
                            autoFocus
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                            <Button type="submit">{editingFolder ? 'Salvar' : 'Criar'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}