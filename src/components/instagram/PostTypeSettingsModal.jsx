import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Check, Loader2, Sparkles, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { neon } from "@/api/neonClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function PostTypeSettingsModal({ open, onOpenChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ocrModel, setOcrModel] = useState(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const queryClient = useQueryClient();

  // Fetch config (global)
  const { data: existingConfig } = useQuery({
    queryKey: ['postTypeConfig', 'global'],
    queryFn: async () => {
      const configs = await neon.entities.PostTypeConfig.list('-created_date', 1);
      return configs[0] || null;
    }
  });

  // Fetch ALL models (only when modal is open)
  const { data: models = [], isLoading: loadingModels } = useQuery({
    queryKey: ['openrouter-models-all'],
    queryFn: async () => {
      const response = await neon.functions.invoke('openrouter', { action: 'listModels' });
      return response.data?.models || [];
    },
    staleTime: 1000 * 60 * 10,
    enabled: open
  });

  useEffect(() => {
    if (existingConfig) {
      if (existingConfig.ocr_model) {
        setOcrModel({ id: existingConfig.ocr_model, name: existingConfig.ocr_model_name });
      } else {
        setOcrModel({ id: 'google/gemini-flash-1.5', name: 'Google: Gemini Flash 1.5' });
      }
    } else {
      setOcrModel({ id: 'google/gemini-flash-1.5', name: 'Google: Gemini Flash 1.5' });
    }
  }, [existingConfig]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingConfig?.id) {
        return neon.entities.PostTypeConfig.update(existingConfig.id, data);
      }
      return neon.entities.PostTypeConfig.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postTypeConfig', 'global'] });
      toast.success('Configurações salvas!');
      onOpenChange(false);
    },
    onError: () => toast.error('Erro ao salvar')
  });

  const handleSave = () => {
    saveMutation.mutate({
      ocr_model: ocrModel?.id || '',
      ocr_model_name: ocrModel?.name || ''
    });
  };

  const filteredModels = models.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectModel = (model) => {
    setOcrModel({ id: model.id, name: model.name });
    setOpenCombobox(false);
  };

  // Check model capabilities
  const hasVision = (model) => {
    return model?.architecture?.modality?.includes('image') || 
           model?.id?.includes('vision') ||
           model?.id?.includes('gemini') ||
           model?.id?.includes('gpt-4o') ||
           model?.id?.includes('claude-3');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Configurações de OCR</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          {/* Model Selection - Popover Style */}
          <div>
            <Label className="mb-2 block">
              Selecione o modelo para leitura de imagens (OCR)
            </Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between font-normal text-left h-auto py-3"
                >
                  {ocrModel ? (
                    <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                      <span className="font-medium truncate w-full">{ocrModel.name}</span>
                      <span className="text-xs text-slate-500 truncate w-full">{ocrModel.id}</span>
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
                <ScrollArea className="h-[300px] p-1">
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
                      {filteredModels.slice(0, 50).map((model) => (
                        <div
                        key={model.id}
                        onClick={() => handleSelectModel(model)}
                        className={`p-2 rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                          ocrModel?.id === model.id 
                            ? 'bg-indigo-50 text-indigo-900' 
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        >
                        <div className="flex-1 min-w-0 mr-2">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">{model.name}</p>
                            {hasVision(model) && (
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" title="Suporta Visão" />
                            )}
                          </div>
                          <p className={`text-xs truncate ${ocrModel?.id === model.id ? 'text-indigo-500' : 'text-slate-400'}`}>
                            {model.id}
                          </p>
                        </div>
                        {ocrModel?.id === model.id && (
                          <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <p className="text-xs text-slate-500 mt-2">
              Recomendado: google/gemini-flash-1.5, openai/gpt-4o, anthropic/claude-3.5-sonnet
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}