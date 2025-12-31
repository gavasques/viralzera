import React, { useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Database, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StepTema({ focusId, value, onChange }) {
  // Fetch modelings for selector
  const { data: modelings = [] } = useQuery({
    queryKey: ['modelings-wizard-tema', focusId],
    queryFn: () => base44.entities.Modeling.filter({ focus_id: focusId }, '-created_date', 50),
    enabled: !!focusId
  });

  const handleModelingChange = (modelingId) => {
    if (modelingId === 'none') {
      // Limpar seleção, mas manter tema se o usuário já digitou algo diferente (opcional, aqui vou manter o comportamento simples)
      // Se quiser limpar o tema apenas se ele for igual ao da modelagem anterior, seria complexo.
      // Vou apenas limpar a seleção de modelagem.
      onChange({ 
        ...value, 
        selectedModelings: [] 
      });
      return;
    }

    const selectedModeling = modelings.find(m => m.id === modelingId);
    if (selectedModeling) {
      const newTema = selectedModeling.creator_idea || value.tema;
      
      onChange({ 
        ...value, 
        tema: newTema,
        selectedModelings: [modelingId] // Define esta modelagem como selecionada
      });
    }
  };

  // Find currently selected modeling (if any) to show in select
  const currentModelingId = value.selectedModelings?.[0] || '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Modeling Selector */}
      <div className="space-y-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
        <Label className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          Basear em uma Modelagem (Opcional)
        </Label>
        <p className="text-xs text-indigo-600/80">
          Selecione uma modelagem para preencher o tema automaticamente com a Ideia do Criador e usar os materiais como referência.
        </p>
        
        <Select 
          value={currentModelingId} 
          onValueChange={handleModelingChange}
        >
          <SelectTrigger className="bg-white border-indigo-200 focus:ring-indigo-500">
            <SelectValue placeholder="Selecione uma modelagem..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Nenhuma (Começar do zero) --</SelectItem>
            {modelings.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentModelingId && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-100/50 p-2 rounded-lg">
            <Sparkles className="w-3 h-3" />
            <span>Modelagem selecionada e materiais vinculados para referência</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-red-600" />
          Tema Central do Vídeo
        </Label>
        <p className="text-sm text-slate-500">
          Descreva sobre o que será o vídeo. Você pode editar a ideia trazida da modelagem.
        </p>
      </div>

      <Textarea
        value={value.tema || ''}
        onChange={(e) => onChange({ ...value, tema: e.target.value })}
        placeholder="Ex: Como ganhar dinheiro vendendo na Amazon FBA em 2024, explicando os primeiros passos para iniciantes..."
        className="min-h-[120px] text-base resize-none"
        autoFocus
      />

      <div className="bg-red-50 rounded-lg p-4 border border-red-100">
        <p className="text-xs text-red-700 font-medium mb-1">💡 Dica</p>
        <p className="text-xs text-red-600/80 leading-relaxed">
          Quanto mais detalhes você fornecer sobre o tema, mais personalizado e relevante será o roteiro gerado.
        </p>
      </div>
    </div>
  );
}