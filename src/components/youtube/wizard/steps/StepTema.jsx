import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lightbulb } from "lucide-react";

export function StepTema({ value, onChange }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-red-600" />
          Tema Central do Vídeo
        </Label>
        <p className="text-sm text-slate-500">
          Descreva sobre o que será o vídeo. Seja específico para obter melhores resultados.
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