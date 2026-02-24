import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, BrainCircuit, Globe, Bot } from "lucide-react";
import { WizardCombobox } from "../WizardCombobox";
import { fetchModels, supportsReasoning } from "@/components/chat/OpenRouterService";

export function StepSettings({ value, onChange }) {
  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Fetch User Config for API Key
  const { data: userConfig } = useQuery({
    queryKey: ['userConfig'],
    queryFn: async () => {
      const user = await neon.auth.me();
      const configs = await neon.entities.UserConfig.filter({ created_by: user.email });
      return configs[0];
    },
    staleTime: 60000
  });

  // Fetch Models
  useEffect(() => {
    const loadModels = async () => {
      if (userConfig?.openrouter_api_key) {
        setIsLoadingModels(true);
        try {
          const data = await fetchModels(userConfig.openrouter_api_key);
          setModels(data.sort((a, b) => a.name.localeCompare(b.name)));
          
          // Set default if not set
          if (!value.model && data.length > 0) {
            // Prefer user's default or a common good model
            const defaultModel = userConfig.default_model || 'openai/gpt-4o-mini';
            const found = data.find(m => m.id === defaultModel) || data[0];
            onChange({ 
              ...value, 
              model: found.id,
              modelName: found.name 
            });
          }
        } catch (error) {
          console.error("Error loading models:", error);
        } finally {
          setIsLoadingModels(false);
        }
      } else {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, [userConfig?.openrouter_api_key]);

  const handleModelChange = (modelId) => {
    const selectedModel = models.find(m => m.id === modelId);
    onChange({ 
      ...value, 
      model: modelId,
      modelName: selectedModel?.name || modelId
    });
  };

  const isReasoningSupported = supportsReasoning(value.model);

  const modelOptions = models.map(m => ({
    value: m.id,
    label: m.name,
    searchLabel: `${m.name} ${m.id}`,
    original: m
  }));

  if (!userConfig?.openrouter_api_key) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="bg-amber-50 p-3 rounded-full">
           <Settings className="w-8 h-8 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-900">Configuração Necessária</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Para selecionar modelos, você precisa configurar sua API Key do OpenRouter nas configurações de usuário.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Model Selection */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            Modelo de Inteligência Artificial
          </Label>
          <p className="text-sm text-slate-500">
            Escolha o modelo mais adequado para esta tarefa.
          </p>
        </div>

        {isLoadingModels ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <WizardCombobox
            value={value.model}
            onChange={handleModelChange}
            options={modelOptions}
            placeholder="Selecione um modelo..."
            searchPlaceholder="Buscar modelo (ex: gpt-4, claude)..."
          />
        )}
      </div>

      <div className="h-px bg-slate-100" />

      {/* Advanced Settings */}
      <div className="space-y-6">
        <Label className="text-sm font-semibold text-slate-900 uppercase tracking-wide text-xs">
          Capacidades Adicionais
        </Label>

        {/* Deep Thinking */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-slate-200 bg-white">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
               <BrainCircuit className="w-4 h-4 text-purple-600" />
               <span className="font-medium text-slate-900">Deep Thinking (Raciocínio)</span>
             </div>
             <p className="text-xs text-slate-500 max-w-[280px]">
               Permite que a IA "pense" antes de responder. Ideal para scripts complexos e estruturados.
             </p>
             {!isReasoningSupported && value.model && (
               <p className="text-[10px] text-amber-600 font-medium mt-1">
                 * Não suportado pelo modelo selecionado
               </p>
             )}
          </div>
          <div className="flex flex-col gap-3 items-end">
            <Switch 
              checked={value.enableReasoning}
              onCheckedChange={(checked) => onChange({ ...value, enableReasoning: checked })}
              disabled={!isReasoningSupported}
            />
            {value.enableReasoning && (
              <Select 
                value={value.reasoningEffort} 
                onValueChange={(val) => onChange({ ...value, reasoningEffort: val })}
              >
                <SelectTrigger className="w-[100px] h-7 text-xs">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Web Search */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-slate-200 bg-white">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
               <Globe className="w-4 h-4 text-blue-600" />
               <span className="font-medium text-slate-900">Web Search (Internet)</span>
             </div>
             <p className="text-xs text-slate-500 max-w-[280px]">
               Permite que a IA busque informações atualizadas na web para enriquecer o script.
             </p>
          </div>
          <Switch 
            checked={value.enableWebSearch}
            onCheckedChange={(checked) => onChange({ ...value, enableWebSearch: checked })}
          />
        </div>
      </div>

    </div>
  );
}