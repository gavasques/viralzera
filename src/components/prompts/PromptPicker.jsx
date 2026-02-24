import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { neon } from '@/api/neonClient';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Bot, MessageCircle, Check } from 'lucide-react';

export default function PromptPicker({ type = 'system_prompt', onSelect, selectedPromptId }) {
    const [search, setSearch] = useState('');

    const { data: prompts = [], isLoading } = useQuery({
        queryKey: ['prompts'],
        queryFn: () => neon.entities.Prompt.list('-created_date', 100),
        staleTime: 1000 * 60 * 5
    });

    const filteredPrompts = useMemo(() => {
        return prompts.filter(p => {
            const matchesType = p.type === type;
            const matchesSearch = !search || 
                p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.content.toLowerCase().includes(search.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [prompts, type, search]);

    const isSystem = type === 'system_prompt';

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder={`Buscar prompts de ${isSystem ? 'sistema' : 'usuário'}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            <ScrollArea className="h-[200px] border rounded-lg">
                <div className="p-2 space-y-1">
                    {isLoading ? (
                        <div className="text-center py-8 text-slate-400 text-sm">Carregando...</div>
                    ) : filteredPrompts.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Nenhum prompt {isSystem ? 'de sistema' : 'de usuário'} encontrado
                        </div>
                    ) : (
                        filteredPrompts.map(prompt => {
                            const isSelected = selectedPromptId === prompt.id;
                            return (
                                <div
                                    key={prompt.id}
                                    onClick={() => onSelect(prompt)}
                                    className={`
                                        p-3 rounded-lg cursor-pointer transition-all border
                                        ${isSelected 
                                            ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' 
                                            : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'}
                                    `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center ${isSystem ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {isSystem ? <Bot className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                                            </div>
                                            <span className="font-medium text-sm text-slate-900">{prompt.title}</span>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                                    </div>
                                    {prompt.description && (
                                        <p className="text-xs text-slate-500 mt-1 ml-8 line-clamp-1">{prompt.description}</p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}