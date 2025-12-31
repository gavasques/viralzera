import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Youtube } from "lucide-react";

export function StepName({ value, onChange }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-600" />
          Título do Roteiro
        </Label>
        <p className="text-sm text-slate-500">
          Dê um nome para identificar seu roteiro de vídeo.
        </p>
      </div>

      <Input
        value={value.title || ''}
        onChange={(e) => onChange({ ...value, title: e.target.value })}
        placeholder="Ex: Como ganhar dinheiro na internet em 2024"
        className="h-12 text-lg"
        autoFocus
      />

      <div className="bg-red-50 rounded-lg p-4 border border-red-100">
        <p className="text-xs text-red-700 font-medium mb-1">💡 Dica</p>
        <p className="text-xs text-red-600/80 leading-relaxed">
          Use um título descritivo que facilite encontrar este roteiro depois.
        </p>
      </div>
    </div>
  );
}