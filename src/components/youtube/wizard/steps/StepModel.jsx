import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Globe, BrainCircuit, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QUERY_KEYS } from "@/components/constants/queryKeys";
import { cn } from "@/lib/utils";

export function StepModel({ value, onChange }) {
  const { data: approvedModels = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.APPROVED_MODELS],
    queryFn: () => neon.entities.ApprovedModel.filter({ is_active: true }, 'order', 100),
    staleTime: 60000
  });

  const scriptModels = approvedModels.filter(m => 
    m.category === 'both' || m.category === 'script'
  );

  React.useEffect(() => {
    if (!value.model && scriptModels.length > 0) {
      const defaultModel = scriptModels[0];
      onChange({ 
        ...value, 
        model: defaultModel.model_id, 
        modelName: defaultModel.alias,
        enableReasoning: false,
        enableWebSearch: false
      });
    }
  }, [scriptModels, value.model]);

  const selectedModel = scriptModels.find(m => m.model_id === value.model);
  const canReason = selectedModel?.supports_reasoning || false;
  const canSearch = selectedModel?.supports_web_search || false;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (scriptModels.length === 0) {
    return (
      <div className="text-center p-8 bg-amber-50 rounded-lg border border-amber-200">
        <Bot className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <h3 className="font-medium text-amber-900">Nenhum modelo disponível</h3>
        <p className="text-sm text-amber-700 mt-1">
          Peça ao administrador para configurar modelos de IA.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Bot className="w-4 h-4 text-red-600" />
            Modelo de Inteligência
          </Label>
          <p className="text-sm text-slate-500">
            Escolha o modelo de IA que vai criar seu roteiro.
          </p>
        </div>

        <ScrollArea className="h-[180px] border rounded-xl">
          <div className="p-2 space-y-2">
            {scriptModels.map(model => {
              const isSelected = value.model === model.model_id;
              
              return (
                <div
                  key={model.id}
                  onClick={() => {
                    onChange({ 
                      ...value, 
                      model: model.model_id, 
                      modelName: model.alias,
                      enableReasoning: model.supports_reasoning ? value.enableReasoning : false,
                      enableWebSearch: model.supports_web_search ? value.enableWebSearch : false
                    });
                  }}
                  className={cn(
                    "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                    isSelected 
                      ? "border-red-500 bg-red-50 shadow-sm" 
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{model.alias}</span>
                      {isSelected && (
                        <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {model.supports_reasoning && (
                        <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                          <BrainCircuit className="w-3 h-3 mr-1" /> Deep Think
                        </Badge>
                      )}
                      {model.supports_web_search && (
                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                          <Globe className="w-3 h-3 mr-1" /> Web
                        </Badge>
                      )}
                    </div>
                  </div>
                  {model.description && (
                    <p className="text-xs text-slate-500 mt-1">{model.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Reasoning */}
        <div className={cn(
          "p-4 rounded-xl border transition-all duration-200",
          value.enableReasoning 
            ? "bg-purple-50 border-purple-200 shadow-sm" 
            : "bg-white border-slate-200",
          !canReason && "opacity-50 pointer-events-none grayscale"
        )}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-md border border-slate-100">
                <BrainCircuit className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <Label className="font-medium text-slate-900">Deep Think</Label>
                <p className="text-[10px] text-slate-500">Raciocínio estendido</p>
              </div>
            </div>
            <Switch 
              checked={value.enableReasoning}
              onCheckedChange={(checked) => onChange({ ...value, enableReasoning: checked })}
              disabled={!canReason}
            />
          </div>
          
          {value.enableReasoning && (
            <div className="pt-3 border-t border-purple-100 animate-in slide-in-from-top-1">
              <Label className="text-[10px] text-purple-700 font-medium uppercase tracking-wide mb-1.5 block">Nível de Esforço</Label>
              <Select 
                value={value.reasoningEffort || 'medium'} 
                onValueChange={(val) => onChange({ ...value, reasoningEffort: val })}
              >
                <SelectTrigger className="h-8 bg-white border-purple-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {!canReason && (
            <div className="pt-2">
              <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-slate-200">Não suportado</Badge>
            </div>
          )}
        </div>

        {/* Web Search */}
        <div className={cn(
          "p-4 rounded-xl border transition-all duration-200",
          value.enableWebSearch 
            ? "bg-emerald-50 border-emerald-200 shadow-sm" 
            : "bg-white border-slate-200",
          !canSearch && "opacity-50 pointer-events-none grayscale"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white p-1.5 rounded-md border border-slate-100">
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <Label className="font-medium text-slate-900">Web Search</Label>
                <p className="text-[10px] text-slate-500">Pesquisa na internet</p>
              </div>
            </div>
            <Switch 
              checked={value.enableWebSearch}
              onCheckedChange={(checked) => onChange({ ...value, enableWebSearch: checked })}
              disabled={!canSearch}
            />
          </div>
          <div className="mt-3 text-xs text-slate-500 leading-relaxed">
            Permite que a IA acesse informações atuais da internet.
          </div>
          {!canSearch && (
            <div className="pt-2">
              <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-slate-200">Não suportado</Badge>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}