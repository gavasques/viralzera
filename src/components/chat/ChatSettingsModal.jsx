import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Check, RotateCcw, Loader2, ChevronsUpDown, Brain, Globe } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
/**
 * Modal unificado de configurações de chat
 * 
 * Props:
 * - open: Estado de abertura
 * - onOpenChange: Callback de mudança de estado
 * - configEntity: Nome da entidade de configuração (ex: 'AudienceConfig')
 * - title: Título do modal
 * - defaultPrompt: Prompt padrão
 * - promptPlaceholders: Array de placeholders disponíveis [{key, description}]
 */
export default function ChatSettingsModal({
  open,
  onOpenChange,
  configEntity,
  title = "Configurações do Chat",
  defaultPrompt = "",
  promptPlaceholders = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState(null);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [enableReasoning, setEnableReasoning] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState('medium');
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing config (global - único para todos os usuários)
  const { data: existingConfig, isLoading: loadingConfig } = useQuery({
    queryKey: [configEntity, 'global'],
    queryFn: async () => {
      const configs = await base44.entities[configEntity].list('-created_date', 1);
      return configs[0] || null;
    },
    enabled: !!configEntity && open,
    staleTime: 1000 * 60 * 5
  });

  // Fetch ALL models via backend (cached globally)
  const { data: models = [], isLoading: loadingModels } = useQuery({
    queryKey: ['openrouter-models-all'],
    queryFn: async () => {
      const response = await base44.functions.invoke('openrouter', { action: 'listModels' });
      return response.data?.models || [];
    },
    staleTime: 1000 * 60 * 10,
    enabled: open
  });

  // Helper functions for model capabilities
  const supportsReasoning = (model) => {
    if (!model) return false;
    const id = model.id?.toLowerCase() || '';
    
    // Check known patterns for reasoning models
    const hasKeyword = id.includes('thinking') || 
                       id.includes('reasoning') ||
                       id.includes('o1') ||
                       id.includes('o3') ||
                       id.includes('r1');
                       
    // Check supported parameters from OpenRouter
    const hasParam = model.supported_parameters?.includes('include_reasoning');
    
    return hasKeyword || hasParam;
  };

  const hasNativeWebSearch = (model) => {
    if (!model) return false;
    return model.id?.includes('perplexity') || 
           model.id?.includes('online') ||
           model.id?.includes('search');
  };

  // Load existing config
  useEffect(() => {
    if (existingConfig) {
      // Support both standard field names and TrendConfig-specific names
      const modelId = existingConfig.model || existingConfig.search_model;
      const modelName = existingConfig.model_name || existingConfig.search_model_name;
      const promptValue = existingConfig.prompt || existingConfig.default_prompt;
      
      if (modelId) {
        setSelectedModel({ id: modelId, name: modelName });
      } else {
        setSelectedModel(null);
      }
      if (promptValue) {
        setPrompt(promptValue);
      }
      setEnableReasoning(existingConfig.enable_reasoning || false);
      setReasoningEffort(existingConfig.reasoning_effort || 'medium');
      setEnableWebSearch(existingConfig.enable_web_search || false);
    }
  }, [existingConfig]);

  // Save mutation (global - único registro compartilhado)
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingConfig?.id) {
        return base44.entities[configEntity].update(existingConfig.id, data);
      }
      return base44.entities[configEntity].create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [configEntity, 'global'] });
      toast.success('✓ Configurações salvas com sucesso!');
      setTimeout(() => onOpenChange(false), 500);
    },
    onError: (err) => toast.error('✗ Erro ao salvar: ' + (err.message || 'Tente novamente'))
  });

  const handleSave = () => {
    // Support TrendConfig which uses different field names
    const isTrendConfig = configEntity === 'TrendConfig';
    
    const data = isTrendConfig ? {
      search_model: selectedModel?.id || '',
      search_model_name: selectedModel?.name || '',
      default_prompt: prompt,
      enable_reasoning: enableReasoning,
      reasoning_effort: reasoningEffort,
      enable_web_search: enableWebSearch
    } : {
      model: selectedModel?.id || '',
      model_name: selectedModel?.name || '',
      prompt,
      enable_reasoning: enableReasoning,
      reasoning_effort: reasoningEffort,
      enable_web_search: enableWebSearch
    };
    
    saveMutation.mutate(data);
  };

  const filteredModels = models.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {loadingConfig ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Model Selection */}
          <div>
            <Label className="mb-2 block">Modelo de IA</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between font-normal text-left h-auto py-3"
                >
                  {selectedModel ? (
                    <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                      <span className="font-medium truncate w-full">{selectedModel.name}</span>
                      <span className="text-xs text-slate-500 truncate w-full">{selectedModel.id}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500">Selecione um modelo...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[600px] p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar modelo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 border-none shadow-none focus-visible:ring-0 bg-slate-50"
                      autoFocus
                    />
                  </div>
                </div>
                <ScrollArea className="h-[250px] p-1">
                  {loadingModels ? (
                    <div className="flex items-center justify-center h-full py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                  ) : filteredModels.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-500">
                      Nenhum modelo encontrado.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredModels.slice(0, 50).map((model) => {
                        const hasReasoning = supportsReasoning(model);
                        const hasWebSearch = hasNativeWebSearch(model);
                        return (
                          <div
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model);
                              setOpenCombobox(false);
                            }}
                            className={`p-2 rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                              selectedModel?.id === model.id 
                                ? 'bg-indigo-50 text-indigo-900' 
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex-1 min-w-0 mr-2">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate">{model.name}</p>
                                {hasReasoning && (
                                  <Brain className="w-3.5 h-3.5 text-purple-500 shrink-0" title="Suporta Extended Reasoning" />
                                )}
                                {hasWebSearch && (
                                  <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" title="Web Search Nativo" />
                                )}
                              </div>
                              <p className={`text-xs truncate ${selectedModel?.id === model.id ? 'text-indigo-500' : 'text-slate-400'}`}>
                                {model.id}
                              </p>
                            </div>
                            {selectedModel?.id === model.id && (
                              <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Extended Reasoning */}
          <div className="space-y-3 p-4 bg-purple-50/50 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <Label className="text-sm font-medium text-purple-900">Extended Reasoning</Label>
              </div>
              <Switch 
                checked={enableReasoning} 
                onCheckedChange={setEnableReasoning}
              />
            </div>
            {supportsReasoning(selectedModel) ? (
              <p className="text-xs text-purple-700">
                Permite raciocínio estendido para análises mais profundas.
              </p>
            ) : (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                Suporte nativo não detectado, mas você pode forçar a ativação.
              </p>
            )}
            
            {enableReasoning && supportsReasoning(selectedModel) && (
              <div>
                <Label className="text-xs text-purple-700 mb-1.5 block">Nível de Esforço</Label>
                <Select value={reasoningEffort} onValueChange={setReasoningEffort}>
                  <SelectTrigger className="bg-white border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xhigh">Extra Alto (~95% dos tokens)</SelectItem>
                    <SelectItem value="high">Alto (~80% dos tokens)</SelectItem>
                    <SelectItem value="medium">Médio (~50% dos tokens)</SelectItem>
                    <SelectItem value="low">Baixo (~20% dos tokens)</SelectItem>
                    <SelectItem value="minimal">Mínimo (~10% dos tokens)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Web Search */}
          <div className="space-y-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-medium text-blue-900">Web Search Tool</Label>
              </div>
              <Switch 
                checked={enableWebSearch} 
                onCheckedChange={setEnableWebSearch}
              />
            </div>
            <p className="text-xs text-blue-700">
              Acessa informações em tempo real da web para respostas atualizadas.
            </p>
            {enableWebSearch && (
              <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
                <strong>Custo adicional:</strong> Web search tem custo extra mesmo em modelos gratuitos.
              </div>
            )}
          </div>

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Prompt do Sistema</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setPrompt(defaultPrompt)}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Restaurar Padrão
              </Button>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[200px] text-sm font-mono"
              placeholder="Prompt do sistema..."
            />
            {promptPlaceholders.length > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Placeholders: {promptPlaceholders.map(p => `{{${p.key}}}`).join(', ')}
              </p>
            )}
          </div>
        </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}