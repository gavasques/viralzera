import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, ScrollText, Search, Check, X } from 'lucide-react';

export default function GroupSettingsModal({ 
    open, 
    onOpenChange, 
    group, 
    onSave,
    isLoading 
}) {
    const [title, setTitle] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [selectedPromptId, setSelectedPromptId] = useState(null);
    const [promptMode, setPromptMode] = useState('write');
    const [promptSearch, setPromptSearch] = useState('');

    // Fetch saved prompts
    const { data: savedPrompts = [] } = useQuery({
        queryKey: ['prompts'],
        queryFn: () => base44.entities.Prompt.list('-created_date', 100),
        staleTime: 1000 * 60 * 5
    });

    const systemPrompts = savedPrompts.filter(p => 
        p.type === 'system_prompt' && 
        (!promptSearch || 
            p.title.toLowerCase().includes(promptSearch.toLowerCase()) || 
            p.content.toLowerCase().includes(promptSearch.toLowerCase()))
    );

    // Reset form when opening with group data
    useEffect(() => {
        if (open && group) {
            setTitle(group.title || '');
            setSystemPrompt(group.default_system_prompt || '');
            setSelectedPromptId(group.default_prompt_id || null);
            setPromptMode(group.default_prompt_id ? 'library' : 'write');
            setPromptSearch('');
        } else if (open && !group) {
            setTitle('');
            setSystemPrompt('');
            setSelectedPromptId(null);
            setPromptMode('write');
            setPromptSearch('');
        }
    }, [open, group]);

    const handleSelectPrompt = (prompt) => {
        setSelectedPromptId(prompt.id);
        setSystemPrompt(prompt.content);
    };

    const handleClearPrompt = () => {
        setSelectedPromptId(null);
        setSystemPrompt('');
    };

    const handleSave = () => {
        if (!title.trim()) return;
        
        onSave({
            title: title.trim(),
            default_system_prompt: systemPrompt.trim() || null,
            default_prompt_id: selectedPromptId || null
        });
    };

    const isEditing = !!group;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Configurações do Grupo' : 'Novo Grupo'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Group Name */}
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            Nome do Grupo
                        </label>
                        <Input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Projetos de Marketing..."
                            autoFocus
                        />
                    </div>

                    {/* System Prompt Section */}
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                            System Prompt Padrão (Master)
                        </label>
                        <p className="text-xs text-slate-500 mb-2">
                            Todas as conversas neste grupo usarão este prompt como base. 
                            Se a conversa tiver seu próprio prompt, este será usado no lugar.
                        </p>

                        <Tabs value={promptMode} onValueChange={setPromptMode}>
                            <TabsList className="grid w-full grid-cols-2 mb-3">
                                <TabsTrigger value="write" className="text-xs">
                                    <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Escrever
                                </TabsTrigger>
                                <TabsTrigger value="library" className="text-xs">
                                    <ScrollText className="w-3.5 h-3.5 mr-1.5" /> Biblioteca ({systemPrompts.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="write" className="mt-0">
                                <Textarea 
                                    value={systemPrompt}
                                    onChange={(e) => { 
                                        setSystemPrompt(e.target.value); 
                                        setSelectedPromptId(null); 
                                    }}
                                    placeholder="Ex: Você é um especialista em marketing digital..."
                                    className="min-h-[120px] resize-none text-sm"
                                />
                                {systemPrompt && (
                                    <div className="flex justify-end mt-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={handleClearPrompt}
                                            className="text-slate-400 hover:text-red-500 text-xs h-7"
                                        >
                                            <X className="w-3 h-3 mr-1" /> Limpar
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="library" className="mt-0">
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        placeholder="Buscar prompts de sistema..." 
                                        value={promptSearch}
                                        onChange={(e) => setPromptSearch(e.target.value)}
                                        className="pl-10 h-9"
                                    />
                                </div>
                                <ScrollArea className="h-[180px] border rounded-lg">
                                    <div className="p-2 space-y-1">
                                        {systemPrompts.length === 0 ? (
                                            <div className="text-center py-6 text-slate-400 text-sm">
                                                {savedPrompts.filter(p => p.type === 'system_prompt').length === 0 
                                                    ? 'Nenhum prompt de sistema cadastrado'
                                                    : 'Nenhum resultado encontrado'}
                                            </div>
                                        ) : (
                                            systemPrompts.map(prompt => {
                                                const isSelected = selectedPromptId === prompt.id;
                                                return (
                                                    <div
                                                        key={prompt.id}
                                                        onClick={() => handleSelectPrompt(prompt)}
                                                        className={`
                                                            p-2.5 rounded-lg cursor-pointer transition-all border
                                                            ${isSelected 
                                                                ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' 
                                                                : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'}
                                                        `}
                                                    >
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <span className="font-medium text-sm text-slate-900">{prompt.title}</span>
                                                            {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                                                        </div>
                                                        <p className="text-xs text-slate-500 line-clamp-2">{prompt.content}</p>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={!title.trim() || isLoading}
                    >
                        {isLoading ? 'Salvando...' : (isEditing ? 'Salvar' : 'Criar Grupo')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}