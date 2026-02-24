import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";

export function StepTema({ focusId, value, onChange }) {
  // Fetch modelings for selector
  const { data: modelings = [] } = useQuery({
    queryKey: ['modelings-wizard-tema', focusId],
    queryFn: () => neon.entities.Modeling.filter({ focus_id: focusId }, '-updated_date', 50),
    enabled: !!focusId,
    staleTime: 0,
    refetchOnMount: true
  });

  const handleModelingChange = async (modelingId) => {
    if (modelingId === 'none') {
      onChange({ 
        ...value, 
        selectedModelings: [],
        creativeDirective: null
      });
      return;
    }

    // Fetch fresh data directly from API to ensure we get the latest
    try {
      const freshModeling = await neon.entities.Modeling.get(modelingId);
      
      if (freshModeling) {
        const idea = freshModeling.creator_idea;
        const title = freshModeling.title;
        
        // Use creator_idea if available, otherwise title
        const newTema = idea || title || value.tema;
        
        onChange({ 
          ...value, 
          tema: newTema,
          selectedModelings: [modelingId],
          creativeDirective: null
        });

        if (idea) {
          toast.success("Tema preenchido com a Ideia do Criador do Dossiê");
        } else {
          toast.info("Tema preenchido com o título da Modelagem");
        }
      }
    } catch (err) {
      console.error('Erro ao carregar modelagem:', err);
      toast.error('Erro ao carregar dados da modelagem');
    }
  };

  const currentModelingId = value.selectedModelings?.[0] || '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="space-y-3 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-bold text-indigo-900">
              Carregar do Dossiê (Modelagem)
            </Label>
            <p className="text-xs text-indigo-700/80 leading-relaxed">
              Selecione um dossiê existente para carregar a "Ideia do Criador" como tema e usar os materiais analisados como referência.
            </p>
          </div>
        </div>
        
        <Select 
          value={currentModelingId} 
          onValueChange={handleModelingChange}
        >
          <SelectTrigger className="bg-white border-indigo-200 focus:ring-indigo-500 h-10">
            <SelectValue placeholder="Selecione um dossiê..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Começar do zero --</SelectItem>
            {modelings.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Tema Central do Vídeo
          </Label>
          <p className="text-sm text-slate-500">
            Descreva sobre o que será o vídeo ou refine a ideia importada do dossiê.
          </p>
        </div>

        <Textarea
          value={value.tema || ''}
          onChange={(e) => onChange({ ...value, tema: e.target.value })}
          placeholder="Ex: Como ganhar dinheiro vendendo na Amazon FBA em 2024..."
          className="min-h-[140px] text-base resize-none p-4 shadow-sm border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
          autoFocus
        />
      </div>

      <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
        <Sparkles className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Dica Pro:</strong> A IA usará este tema junto com os materiais da modelagem selecionada para criar um roteiro único. Você pode editar o tema livremente acima.
        </p>
      </div>
    </div>
  );
}