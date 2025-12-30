import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CanvasFormModal({ open, onOpenChange, canvas }) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [folderId, setFolderId] = useState('none');

    const { data: folders = [] } = useQuery({
        queryKey: ['canvasFolders'],
        queryFn: () => base44.entities.CanvasFolder.list('name', 100),
    });

    useEffect(() => {
        if (open) {
            if (canvas) {
                setTitle(canvas.title || '');
                setContent(canvas.content || '');
                setFolderId(canvas.folder_id || 'none');
            } else {
                setTitle('');
                setContent('');
                setFolderId('none');
            }
        }
    }, [open, canvas]);

    const createMutation = useMutation({
        mutationFn: (data) => base44.entities.Canvas.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['canvas-items'] });
            toast.success('Canvas criado!');
            onOpenChange(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Canvas.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['canvas-items'] });
            toast.success('Canvas atualizado!');
            onOpenChange(false);
        }
    });

    const handleSubmit = () => {
        if (!title.trim()) {
            toast.error('Digite um título');
            return;
        }
        if (!content.trim()) {
            toast.error('Digite o conteúdo');
            return;
        }

        const data = {
            title,
            content,
            folder_id: folderId === 'none' ? null : folderId,
            source: 'manual'
        };

        if (canvas?.id) {
            updateMutation.mutate({ id: canvas.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{canvas?.id ? 'Editar Canvas' : 'Novo Canvas'}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Título do canvas"
                            />
                        </div>
                        <div>
                            <Select value={folderId} onValueChange={setFolderId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma pasta" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem Pasta</SelectItem>
                                    {folders.map(folder => (
                                        <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Cole ou escreva seu conteúdo aqui..."
                        className="min-h-[200px]"
                    />
                    
                    <div className="text-sm text-slate-500">
                        {content?.length || 0} caracteres
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isLoading ? "Salvando..." : canvas?.id ? "Salvar" : "Criar Canvas"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}