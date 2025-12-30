import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const REASONING_EFFORTS = [
  { value: 'minimal', label: 'Mínimo' },
  { value: 'low', label: 'Baixo' },
  { value: 'medium', label: 'Médio' },
  { value: 'high', label: 'Alto' },
  { value: 'xhigh', label: 'Muito Alto' }
];

export default function ChatSettingsModal({ 
  open, 
  onOpenChange, 
  configEntity, 
  title,
  defaultPrompt = '',
  promptPlaceholders = []
}) {
  const queryClient = useQueryClient();
  const [model, setModel] = useState("");
  const [modelName, setModelName] = useState("");
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [enableReasoning, setEnableReasoning] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState("medium");
  const [enableWebSearch, setEnableWebSearch] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: [configEntity],
    queryFn: async () => {
      const configs = await base44.entities[configEntity].list();
      return configs[0] || null;
    },
    enabled: open && !!configEntity,
  });

  useEffect(() => {
    if (config) {
      setModel(config.model || "");
      setModelName(config.model_name || "");
      setPrompt(config.prompt || defaultPrompt);
      setEnableReasoning(config.enable_reasoning || false);
      setReasoningEffort(config.reasoning_effort || "medium");
      setEnableWebSearch(config.enable_web_search || false);
    } else {
      setPrompt(defaultPrompt);
    }
  }, [config, defaultPrompt]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (config?.id) {
        return base44.entities[configEntity].update(config.id, data);
      } else {
        return base44.entities[configEntity].create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [configEntity] });
      toast.success("Configurações salvas com sucesso!");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      model,
      model_name: modelName,
      prompt,
      enable_reasoning: enableReasoning,
      reasoning_effort: reasoningEffort,
      enable_web_search: enableWebSearch,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Modelo OpenRouter</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ex: openai/gpt-4o"
              />
              <Input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Nome amigável do modelo"
              />
            </div>

            <div className="space-y-2">
              <Label>Prompt do Sistema</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Prompt do sistema para o agente..."
                className="min-h-[150px]"
              />
              {promptPlaceholders.length > 0 && (
                <p className="text-xs text-slate-500">
                  Placeholders disponíveis: {promptPlaceholders.join(', ')}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between py-2">
              <Label>Ativar Extended Reasoning</Label>
              <Switch
                checked={enableReasoning}
                onCheckedChange={setEnableReasoning}
              />
            </div>

            {enableReasoning && (
              <div className="space-y-2">
                <Label>Nível de Esforço do Reasoning</Label>
                <Select value={reasoningEffort} onValueChange={setReasoningEffort}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONING_EFFORTS.map((effort) => (
                      <SelectItem key={effort.value} value={effort.value}>
                        {effort.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <Label>Ativar Web Search</Label>
              <Switch
                checked={enableWebSearch}
                onCheckedChange={setEnableWebSearch}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}