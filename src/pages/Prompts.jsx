import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Bot, MessageCircle, Pencil, Trash2, MoreVertical, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PromptFormModal from '@/components/prompts/PromptFormModal';
import PromptCard from '@/components/prompts/PromptCard';
import DeletePromptDialog from '@/components/prompts/DeletePromptDialog';
import PromptViewerModal from '@/components/prompts/PromptViewerModal';
import FolderSidebar from '@/components/prompts/FolderSidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Tag } from 'lucide-react';

export default function Prompts() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [selectedFolderId, setSelectedFolderId] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewingPrompt, setViewingPrompt] = useState(null);

    // Fetch prompts
    const { data: prompts = [], isLoading } = useQuery({
        queryKey: ['prompts'],
        queryFn: () => base44.entities.Prompt.list('title', 200),
    });

    // Extract unique categories
    const categories = [...new Set(prompts.map(p => p.category).filter(Boolean))];

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.Prompt.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prompts'] });
            toast.success('Prompt excluído!');
            setDeleteTarget(null);
        },
        onError: () => toast.error('Erro ao excluir prompt')
    });

    // Filter prompts
    const filteredPrompts = prompts.filter(p => {
        const matchesSearch = !search || 
            p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.content.toLowerCase().includes(search.toLowerCase()) ||
            (p.tags && p.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
            
        const matchesType = activeTab === 'all' || p.type === activeTab;
        
        const matchesFolder = selectedFolderId === 'all' 
            ? true 
            : selectedFolderId === null 
                ? !p.folder_id 
                : p.folder_id === selectedFolderId;

        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

        return matchesSearch && matchesType && matchesFolder && matchesCategory;
    }).sort((a, b) => a.title.localeCompare(b.title));

    const handleEdit = (prompt) => {
        setEditingPrompt(prompt);
        setIsFormOpen(true);
    };

    const handleNew = () => {
        setEditingPrompt({ folder_id: selectedFolderId !== 'all' ? selectedFolderId : null });
        setIsFormOpen(true);
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-6">
            <FolderSidebar 
                selectedFolderId={selectedFolderId} 
                onSelectFolder={setSelectedFolderId} 
            />

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Biblioteca de Prompts</h1>
                        <p className="text-slate-500 text-sm mt-1">Gerencie seus prompts de sistema e de usuário</p>
                    </div>
                    <Button onClick={handleNew} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-200">
                        <Plus className="w-4 h-4 mr-2" /> Novo Prompt
                    </Button>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                placeholder="Buscar por título, conteúdo ou tags..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                    <SelectValue placeholder="Categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Categorias</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-slate-100/50">
                            <TabsTrigger value="all">Todos ({prompts.length})</TabsTrigger>
                            <TabsTrigger value="system_prompt">
                                <Bot className="w-3.5 h-3.5 mr-1.5" />
                                Sistema ({prompts.filter(p => p.type === 'system_prompt').length})
                            </TabsTrigger>
                            <TabsTrigger value="user_prompt">
                                <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                                Usuário ({prompts.filter(p => p.type === 'user_prompt').length})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-xl" />
                        ))}
                    </div>
                ) : filteredPrompts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bot className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700">Nenhum prompt encontrado</h3>
                        <p className="text-slate-500 text-sm mt-1">
                            {search || selectedCategory !== 'all' || selectedFolderId !== 'all' 
                                ? 'Tente ajustar os filtros de busca' 
                                : 'Crie seu primeiro prompt para começar'}
                        </p>
                        <Button onClick={handleNew} className="mt-4" variant="outline">
                            <Plus className="w-4 h-4 mr-2" /> Criar Prompt
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPrompts.map(prompt => (
                            <PromptCard 
                                key={prompt.id}
                                prompt={prompt}
                                onClick={() => setViewingPrompt(prompt)}
                                onEdit={() => handleEdit(prompt)}
                                onDelete={() => setDeleteTarget(prompt)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Form Modal */}
            <PromptFormModal 
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                prompt={editingPrompt}
            />

            {/* Viewer Modal */}
            <PromptViewerModal
                open={!!viewingPrompt}
                onOpenChange={(open) => !open && setViewingPrompt(null)}
                prompt={viewingPrompt}
                onEdit={() => viewingPrompt && handleEdit(viewingPrompt)}
            />

            {/* Delete Confirmation */}
            <DeletePromptDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                prompt={deleteTarget}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                isDeleting={deleteMutation.isPending}
            />
        </div>
    );
}