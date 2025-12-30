import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ChevronDown, Brain, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const PREFERRED_MODELS = [
    'z-ai/glm-4.7',
    'minimax/minimax-m2.1',
    'google/gemini-3-pro-preview',
    'openai/gpt-5.2',
    'anthropic/claude-opus-4.5',
    'xiaomi/mimo-v2-flash:free',
    'x-ai/grok-4.1-fast',
    'mistralai/mistral-small-creative'
];

// Models that support extended reasoning
const REASONING_MODELS = [
    'anthropic/claude-sonnet-4',
    'anthropic/claude-3.5-sonnet',
    'openai/o1-preview',
    'openai/o1-mini',
    'openai/o1',
    'google/gemini-2.0-flash-thinking-exp:free',
    'google/gemini-2.0-flash-thinking-exp-1219:free',
    'deepseek/deepseek-r1',
    'deepseek/deepseek-reasoner',
    'qwen/qwq-32b-preview'
];

// Models that support web search plugin
const WEB_SEARCH_MODELS = [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'openai/gpt-4-turbo',
    'anthropic/claude-sonnet-4',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-opus',
    'google/gemini-2.0-flash-exp',
    'google/gemini-pro',
    'perplexity/llama-3.1-sonar-huge-128k-online',
    'perplexity/llama-3.1-sonar-large-128k-online',
    'perplexity/llama-3.1-sonar-small-128k-online'
];

export default function ModelPicker({ selectedModels, onSelectionChange, maxSelection = Infinity }) {
    const [search, setSearch] = useState('');
    const [showAll, setShowAll] = useState(false);

    const { data: allModels, isLoading, isError, error } = useQuery({
        queryKey: ['openRouterModels'],
        queryFn: async () => {
            try {
                const res = await base44.functions.invoke('titanosListModels', {});
                if (res.data?.error) throw new Error(res.data.error);
                return res.data?.data || [];
            } catch (err) {
                console.error("Failed to list models:", err);
                throw err;
            }
        },
        retry: 1,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    const { preferred, others } = useMemo(() => {
        if (!allModels) return { preferred: [], others: [] };
        
        let filtered = allModels;
        if (search) {
            filtered = allModels.filter(m => 
                m.name.toLowerCase().includes(search.toLowerCase()) || 
                m.id.toLowerCase().includes(search.toLowerCase())
            );
        }

        const preferredList = [];
        const othersList = [];

        filtered.forEach(m => {
            if (PREFERRED_MODELS.includes(m.id)) {
                preferredList.push(m);
            } else {
                othersList.push(m);
            }
        });

        // Ensure preferred are sorted by order in PREFERRED_MODELS
        preferredList.sort((a, b) => {
            return PREFERRED_MODELS.indexOf(a.id) - PREFERRED_MODELS.indexOf(b.id);
        });

        return { preferred: preferredList, others: othersList };
    }, [allModels, search]);

    const handleToggle = (modelId) => {
        const isSelected = selectedModels.includes(modelId);
        
        if (!isSelected && selectedModels.length >= maxSelection) {
            toast.warning(`Você pode selecionar no máximo ${maxSelection} modelos.`);
            return;
        }

        const newSelection = isSelected
            ? selectedModels.filter(id => id !== modelId)
            : [...selectedModels, modelId];
        onSelectionChange(newSelection);
    };

    const hasReasoning = (modelId) => REASONING_MODELS.some(m => modelId.includes(m.split('/')[1]) || m === modelId);
    const hasWebSearch = (modelId) => WEB_SEARCH_MODELS.some(m => modelId.includes(m.split('/')[1]) || m === modelId);

    const ModelCard = ({ model }) => {
        const supportsReasoning = hasReasoning(model.id);
        const supportsWebSearch = hasWebSearch(model.id);
        
        return (
            <div 
                key={model.id}
                className={`
                    flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedModels.includes(model.id) 
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                        : 'border-slate-200 hover:border-indigo-300 bg-white'}
                `}
                onClick={() => handleToggle(model.id)}
            >
                <Checkbox 
                    checked={selectedModels.includes(model.id)}
                    onCheckedChange={() => handleToggle(model.id)}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-sm text-slate-900 leading-tight">{model.name}</h4>
                        {PREFERRED_MODELS.includes(model.id) && (
                            <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200 font-medium">
                                TOP PICK
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 break-all">{model.id}</p>
                    
                    {/* Capabilities badges */}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                        {supportsReasoning && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200">
                                <Brain className="w-2.5 h-2.5 mr-1" />
                                Reasoning
                            </Badge>
                        )}
                        {supportsWebSearch && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 bg-blue-50 text-blue-700 border-blue-200">
                                <Globe className="w-2.5 h-2.5 mr-1" />
                                Web Search
                            </Badge>
                        )}
                    </div>
                    
                    <div className="flex gap-2 mt-1.5 text-[10px] text-slate-400">
                        {model.pricing && (
                            <span>
                                ${parseFloat((parseFloat(model.pricing.prompt || 0) * 1000000).toFixed(3))} / ${parseFloat((parseFloat(model.pricing.completion || 0) * 1000000).toFixed(3))} (per 1M)
                            </span>
                        )}
                        {model.context_length && (
                            <span>• {Math.round(model.context_length / 1000)}k ctx</span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Buscar modelos..." 
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        if (e.target.value) setShowAll(true);
                    }}
                    className="pl-9"
                />
            </div>

            <ScrollArea className="flex-1 -mx-1 px-1">
                <div className="flex flex-col gap-3 pb-2">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
                        </div>
                    ) : isError ? (
                        <div className="text-center text-red-500 py-8 flex flex-col items-center">
                            <p className="font-medium">Erro ao carregar modelos.</p>
                            <p className="text-xs mt-1 text-slate-400">{error?.message || "Verifique a chave da API."}</p>
                        </div>
                    ) : (preferred.length === 0 && others.length === 0) ? (
                        <div className="text-center text-slate-500 py-8">
                            Nenhum modelo encontrado.
                        </div>
                    ) : (
                        <>
                            {preferred.length > 0 && (
                                <div className="space-y-3">
                                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Recomendados</h5>
                                    {preferred.map(model => <ModelCard key={model.id} model={model} />)}
                                </div>
                            )}

                            {others.length > 0 && (
                                <>
                                    {!showAll && !search && (
                                        <div className="pt-2">
                                            <Button 
                                                variant="outline" 
                                                className="w-full text-slate-500 border-dashed"
                                                onClick={() => setShowAll(true)}
                                            >
                                                <ChevronDown className="w-4 h-4 mr-2" />
                                                Ver todos os {others.length} modelos
                                            </Button>
                                        </div>
                                    )}

                                    {(showAll || search) && (
                                        <div className="space-y-3 pt-2">
                                            {preferred.length > 0 && <div className="h-px bg-slate-100 my-2" />}
                                            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Outros Modelos</h5>
                                            {others.map(model => <ModelCard key={model.id} model={model} />)}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}