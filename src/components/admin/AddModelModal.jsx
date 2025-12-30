import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Loader2, Brain, Globe, Wrench, Settings2, Info, HelpCircle, FileText, Sliders } from 'lucide-react';
import { getModelCapabilities } from '@/components/chat/OpenRouterService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

// Descrições dos parâmetros - Explicações simples
const PARAM_DESCRIPTIONS = {
  temperature: {
    label: '🌡️ Criatividade',
    description: 'Quanto maior, mais criativo e imprevisível. Quanto menor, mais focado e previsível. Use alto para brainstorm, baixo para tarefas precisas.',
    min: 0, max: 2, step: 0.1, default: 0.7
  },
  top_p: {
    label: '🎯 Foco nas Melhores Palavras',
    description: 'Controla quantas opções de palavras a IA considera. Valor baixo = só as melhores opções. Valor alto = mais variedade.',
    min: 0, max: 1, step: 0.05, default: 1
  },
  top_k: {
    label: '📊 Limite de Opções',
    description: 'Quantas palavras a IA pode escolher por vez. Menos = respostas mais previsíveis. Mais = respostas mais variadas.',
    min: 1, max: 100, step: 1, default: 40
  },
  frequency_penalty: {
    label: '🔄 Evitar Repetição de Palavras',
    description: 'Penaliza palavras que já foram muito usadas. Positivo = menos repetição. Negativo = pode repetir mais.',
    min: -2, max: 2, step: 0.1, default: 0
  },
  presence_penalty: {
    label: '💡 Incentivar Novos Temas',
    description: 'Incentiva a IA a falar de coisas novas. Positivo = mais temas novos. Negativo = pode ficar no mesmo tema.',
    min: -2, max: 2, step: 0.1, default: 0
  },
  repetition_penalty: {
    label: '🚫 Punição por Repetição',
    description: 'Multiplica a penalidade quando repete. 1 = normal. Acima de 1 = evita muito repetir. Abaixo de 1 = permite repetir.',
    min: 0.5, max: 2, step: 0.05, default: 1
  },
  max_tokens: {
    label: '📏 Tamanho Máximo da Resposta',
    description: 'Limite de "palavras" na resposta. Deixe vazio para o padrão. 1000 tokens ≈ 750 palavras.',
    min: 100, max: 128000, step: 100, default: null
  }
};

function ParamSlider({ paramKey, value, onChange, disabled, modelDefault }) {
  const config = PARAM_DESCRIPTIONS[paramKey];
  if (!config) return null;

  const displayValue = value ?? modelDefault ?? config.default;
  const isDefault = value === null || value === undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{config.label}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <p className="text-xs">{config.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          {isDefault && modelDefault !== undefined && (
            <Badge variant="outline" className="text-[10px] text-slate-400">
              padrão: {modelDefault}
            </Badge>
          )}
          <span className="text-sm font-mono text-slate-600 min-w-[40px] text-right">
            {displayValue ?? '—'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Slider
          value={[displayValue ?? config.default]}
          onValueChange={([v]) => onChange(v)}
          min={config.min}
          max={config.max}
          step={config.step}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs h-7 px-2"
          onClick={() => onChange(null)}
          disabled={disabled || isDefault}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}

export default function AddModelModal({ open, onOpenChange, model, existingApproved, onSuccess }) {
  const [alias, setAlias] = useState('');
  const [description, setDescription] = useState('');
  const [supportsReasoningFlag, setSupportsReasoningFlag] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState('high');
  const [supportsWebSearchFlag, setSupportsWebSearchFlag] = useState(false);
  const [supportsToolsFlag, setSupportsToolsFlag] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [category, setCategory] = useState('both');
  const [order, setOrder] = useState(0);
  const [parameters, setParameters] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const isEditing = !!existingApproved;

  // Detecta capacidades do modelo - SEMPRE pega do modelo original da API se disponível
  const capabilities = useMemo(() => {
    // Se estamos editando e temos o modelo original da API, usa ele
    if (existingApproved?._originalModel) {
      return getModelCapabilities(existingApproved._originalModel);
    }
    // Se é um novo modelo da lista, usa diretamente
    if (model) {
      return getModelCapabilities(model);
    }
    // Fallback para capabilities salvas
    if (existingApproved?.model_capabilities) {
      return existingApproved.model_capabilities;
    }
    return { reasoning: false, webSearch: false, tools: false, supportedParams: [] };
  }, [model, existingApproved]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (existingApproved) {
        // Editing existing
        setAlias(existingApproved.alias || '');
        setDescription(existingApproved.description || '');
        setSupportsReasoningFlag(existingApproved.supports_reasoning || false);
        setReasoningEffort(existingApproved.reasoning_effort || 'high');
        setSupportsWebSearchFlag(existingApproved.supports_web_search || false);
        setSupportsToolsFlag(existingApproved.supports_tools || false);
        setIsActive(existingApproved.is_active !== false);
        setCategory(existingApproved.category || 'both');
        setOrder(existingApproved.order || 0);
        setParameters(existingApproved.parameters || {});
        setActiveTab('basic');
      } else if (model) {
        // Adding new - auto-detect capabilities
        setAlias(model.name || model.id || '');
        setDescription('');
        setSupportsReasoningFlag(capabilities.reasoning);
        setReasoningEffort('high');
        setSupportsWebSearchFlag(true); // OpenRouter suporta web search via :online para todos
        setSupportsToolsFlag(capabilities.tools);
        setIsActive(true);
        setCategory('both');
        setOrder(0);
        setParameters({});
        setActiveTab('basic');
      }
    }
  }, [open, model, existingApproved, capabilities]);

  const updateParam = (key, value) => {
    setParameters(prev => {
      if (value === null || value === undefined) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const modelId = isEditing 
        ? existingApproved.model_id 
        : model?.id;
      
      if (!modelId) {
        throw new Error('ID do modelo não encontrado');
      }
      
      const data = {
        model_id: modelId,
        alias: alias.trim(),
        description: description.trim() || null,
        supports_reasoning: supportsReasoningFlag,
        reasoning_effort: supportsReasoningFlag ? reasoningEffort : null,
        supports_web_search: supportsWebSearchFlag,
        supports_tools: supportsToolsFlag,
        is_active: isActive,
        category,
        order,
        parameters: Object.keys(parameters).length > 0 ? parameters : null,
        model_capabilities: capabilities
      };

      if (isEditing) {
        await base44.entities.ApprovedModel.update(existingApproved.id, data);
      } else {
        await base44.entities.ApprovedModel.create(data);
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Modelo atualizado!' : 'Modelo adicionado!');
      onSuccess();
    },
    onError: (err) => {
      console.error('[AddModelModal] Error:', err);
      toast.error('Erro: ' + (err.message || 'Erro desconhecido'));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!alias.trim()) {
      toast.warning('Informe um apelido para o modelo');
      return;
    }
    saveMutation.mutate();
  };

  const paramCount = Object.keys(parameters).filter(k => parameters[k] !== null && parameters[k] !== undefined).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-slate-50/50">
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-purple-600" />
            {isEditing ? 'Editar Modelo' : 'Adicionar Modelo'}
          </DialogTitle>
          <p className="text-xs text-slate-500 font-normal">
            {existingApproved?.model_id || model?.id || ''}
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 px-6">
            <TabsTrigger 
              value="basic" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4"
            >
              <FileText className="w-4 h-4 mr-2" />
              Básico
            </TabsTrigger>
            <TabsTrigger 
              value="capabilities" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4"
            >
              <Brain className="w-4 h-4 mr-2" />
              Capacidades
              {(capabilities.reasoning || capabilities.tools) && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                  {[capabilities.reasoning && 'R', capabilities.tools && 'T'].filter(Boolean).join('+')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="parameters" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-4"
            >
              <Sliders className="w-4 h-4 mr-2" />
              Parâmetros
              {paramCount > 0 && (
                <Badge className="ml-2 h-5 px-1.5 text-[10px] bg-purple-100 text-purple-700">
                  {paramCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Tab: Básico */}
              <TabsContent value="basic" className="mt-0 space-y-5">
                {/* Alias */}
                <div className="space-y-2">
                  <Label>Apelido (Nome para usuários) *</Label>
                  <Input 
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Ex: GPT-4 Turbo, Claude Pro..."
                    autoFocus
                  />
                  <p className="text-xs text-slate-400">
                    Este é o nome que os usuários verão ao selecionar o modelo.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Melhor para textos criativos..."
                    rows={2}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label>Disponível em</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Multi Chat + Gerador de Scripts</SelectItem>
                      <SelectItem value="chat">Apenas Multi Chat</SelectItem>
                      <SelectItem value="script">Apenas Gerador de Scripts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active */}
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <Label className="font-medium">Ativo</Label>
                    <p className="text-xs text-green-700">Visível para usuários</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </TabsContent>

              {/* Tab: Capacidades */}
              <TabsContent value="capabilities" className="mt-0 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-600">Configure as funcionalidades especiais do modelo.</p>
                  {capabilities.supportedParams?.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      {capabilities.supportedParams.length} parâmetros da API
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Reasoning */}
                  {capabilities.reasoning ? (
                    <div className="p-4 border rounded-lg bg-purple-50/50 border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">Deep Think (Reasoning)</span>
                        </div>
                        <Switch 
                          checked={supportsReasoningFlag}
                          onCheckedChange={setSupportsReasoningFlag}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mb-3">
                        Permite raciocínio extendido para respostas mais elaboradas e precisas.
                      </p>
                      {supportsReasoningFlag && (
                        <div className="space-y-2 pt-2 border-t border-purple-200">
                          <Label className="text-xs text-slate-500">Nível de Raciocínio</Label>
                          <Select value={reasoningEffort} onValueChange={setReasoningEffort}>
                            <SelectTrigger className="h-9 bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="xhigh">Muito Alto (xhigh)</SelectItem>
                              <SelectItem value="high">Alto (high)</SelectItem>
                              <SelectItem value="medium">Médio (medium)</SelectItem>
                              <SelectItem value="low">Baixo (low)</SelectItem>
                              <SelectItem value="minimal">Mínimo (minimal)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Web Search */}
                  <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Web Search</span>
                      </div>
                      <Switch 
                        checked={supportsWebSearchFlag}
                        onCheckedChange={setSupportsWebSearchFlag}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Disponível via plugin :online do OpenRouter. Permite buscar informações na web em tempo real.
                    </p>
                  </div>

                  {/* Tool Calling */}
                  {capabilities.tools ? (
                    <div className="p-4 border rounded-lg bg-amber-50/50 border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-5 h-5 text-amber-600" />
                          <span className="font-medium">Tool Calling</span>
                        </div>
                        <Switch 
                          checked={supportsToolsFlag}
                          onCheckedChange={setSupportsToolsFlag}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Permite que o modelo execute ferramentas e funções externas.
                      </p>
                    </div>
                  ) : null}

                  {/* Info se não tiver capacidades especiais */}
                  {!capabilities.reasoning && !capabilities.tools && (
                    <div className="flex items-start gap-3 p-4 bg-slate-100 rounded-lg">
                      <Info className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Capacidades Limitadas</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Este modelo não suporta reasoning ou tool calling nativamente. 
                          Web Search está disponível via plugin OpenRouter.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab: Parâmetros */}
              <TabsContent value="parameters" className="mt-0 space-y-5">
                <p className="text-sm text-slate-600 mb-4">
                  Configure parâmetros padrão para este modelo. Valores vazios usarão o padrão do OpenRouter.
                </p>

                {capabilities.hasTemperature && (
                  <ParamSlider 
                    paramKey="temperature" 
                    value={parameters.temperature} 
                    onChange={(v) => updateParam('temperature', v)}
                    modelDefault={capabilities.defaults?.temperature}
                  />
                )}
                
                {capabilities.hasTopP && (
                  <ParamSlider 
                    paramKey="top_p" 
                    value={parameters.top_p} 
                    onChange={(v) => updateParam('top_p', v)}
                    modelDefault={capabilities.defaults?.top_p}
                  />
                )}
                
                {capabilities.hasTopK && (
                  <ParamSlider 
                    paramKey="top_k" 
                    value={parameters.top_k} 
                    onChange={(v) => updateParam('top_k', v)}
                  />
                )}
                
                {capabilities.hasFrequencyPenalty && (
                  <ParamSlider 
                    paramKey="frequency_penalty" 
                    value={parameters.frequency_penalty} 
                    onChange={(v) => updateParam('frequency_penalty', v)}
                    modelDefault={capabilities.defaults?.frequency_penalty}
                  />
                )}
                
                {capabilities.hasPresencePenalty && (
                  <ParamSlider 
                    paramKey="presence_penalty" 
                    value={parameters.presence_penalty} 
                    onChange={(v) => updateParam('presence_penalty', v)}
                  />
                )}
                
                {capabilities.hasRepetitionPenalty && (
                  <ParamSlider 
                    paramKey="repetition_penalty" 
                    value={parameters.repetition_penalty} 
                    onChange={(v) => updateParam('repetition_penalty', v)}
                  />
                )}
                
                {capabilities.hasMaxTokens && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Max Tokens</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[300px]">
                            <p className="text-xs">Limite máximo de tokens na resposta. Deixe vazio para usar o padrão do modelo.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      type="number"
                      placeholder="Ex: 4096"
                      value={parameters.max_tokens || ''}
                      onChange={(e) => updateParam('max_tokens', e.target.value ? parseInt(e.target.value) : null)}
                      className="h-9"
                    />
                  </div>
                )}

                {/* Show message if no params available */}
                {!capabilities.hasTemperature && !capabilities.hasTopP && !capabilities.hasMaxTokens && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Sliders className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">Sem parâmetros configuráveis</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Este modelo não expõe parâmetros ajustáveis.
                    </p>
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t bg-slate-50/50">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}