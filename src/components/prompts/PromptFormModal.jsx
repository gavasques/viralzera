import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Bot, MessageCircle, Folder, Tag, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import MultiValueInput from '@/components/forms/MultiValueInput';

export default function PromptFormModal({ open, onOpenChange, prompt }) {
    const queryClient = useQueryClient();
    const isEditing = !!prompt;

    // Fetch folders for selection
    const { data: folders = [] } = useQuery({
        queryKey: ['promptFolders'],
        queryFn: () => base44.entities.PromptFolder.list('name', 100),
        enabled: open
    });

    const [form, setForm] = useState({
        title: '',
        type: 'system_prompt',
        content: '',
        description: '',
        folder_id: '',
        category: '',
        tags: []
    });

    useEffect(() => {
        if (open) {
            if (prompt) {
                setForm({
                    title: prompt.title || '',
                    type: prompt.type || 'system_prompt',
                    content: prompt.content || '',
                    description: prompt.description || '',
                    folder_id: prompt.folder_id || '',
                    category: prompt.category || '',
                    tags: prompt.tags || []
                });
            } else {
                setForm({
                    title: '',
                    type: 'system_prompt',
                    content: '',
                    description: '',
                    folder_id: '',
                    category: '',
                    tags: []
                });
            }
        }
    }, [open, prompt]);

    const mutation = useMutation({
        mutationFn: async (data) => {
            if (isEditing) {
                return base44.entities.Prompt.update(prompt.id, data);
            }
            return base44.entities.Prompt.create(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prompts'] });
            toast.success(isEditing ? 'Prompt atualizado!' : 'Prompt criado!');
            onOpenChange(false);
        },
        onError: () => toast.error('Erro ao salvar prompt')
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            toast.warning('Preencha o título e o conteúdo');
            return;
        }
        mutation.mutate(form);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Prompt' : 'Novo Prompt'}</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Prompt</Label>
                            <Input 
                                value={form.title}
                                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Ex: Assistente Sarcástico"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="system_prompt">
                                        <div className="flex items-center gap-2">
                                            <Bot className="w-4 h-4 text-purple-600" />
                                            <span>System Prompt</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="user_prompt">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4 text-blue-600" />
                                            <span>User Prompt</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição (opcional)</Label>
                        <Input 
                            value={form.description}
                            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Breve descrição do que o prompt faz..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Folder className="w-3.5 h-3.5 text-slate-500" /> Pasta
                            </Label>
                            <Select value={form.folder_id || "none"} onValueChange={(v) => setForm(f => ({ ...f, folder_id: v === "none" ? null : v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma pasta" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sem pasta</SelectItem>
                                    {folders.map(folder => (
                                        <SelectItem key={folder.id} value={folder.id}>
                                            <div className="flex items-center gap-2">
                                                <Folder className="w-3.5 h-3.5 text-indigo-500" />
                                                {folder.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-slate-500" /> Categoria
                            </Label>
                            <Input 
                                value={form.category}
                                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                                placeholder="Ex: Marketing, Copy..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-slate-500" /> Tags
                        </Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {form.tags.map((tag, i) => (
                                <span key={i} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs flex items-center gap-1 border border-indigo-100">
                                    {tag}
                                    <button 
                                        type="button" 
                                        onClick={() => setForm(f => ({...f, tags: f.tags.filter((_, idx) => idx !== i)}))}
                                        className="hover:text-red-500"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                        <Input 
                            placeholder="Digite uma tag e pressione Enter"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val && !form.tags.includes(val)) {
                                        setForm(f => ({...f, tags: [...f.tags, val]}));
                                        e.currentTarget.value = '';
                                    }
                                }
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Conteúdo do Prompt</Label>
                        <Textarea 
                            value={form.content}
                            onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                            placeholder={form.type === 'system_prompt' 
                                ? "Você é um assistente especializado em..." 
                                : "Analise o seguinte texto e..."}
                            className="min-h-[200px] font-mono text-sm"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEditing ? 'Salvar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}