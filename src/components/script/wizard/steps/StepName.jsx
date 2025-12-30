import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";

export function StepName({ value, onChange }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">Dê um nome ao seu script</h2>
        </div>
        <p className="text-sm text-slate-500">
          Um nome ajuda a identificar e organizar seus scripts depois.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="script-title" className="text-sm font-medium text-slate-700">
          Nome do Script *
        </Label>
        <Input
          id="script-title"
          placeholder="Ex: Carrossel sobre Produtividade, Reels de Vendas..."
          value={value.title || ''}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          className="h-12 text-base"
          autoFocus
        />
        <p className="text-xs text-slate-400">
          Dica: Use algo descritivo como "Reels - Dicas de Investimento" ou "Carrossel - Lançamento Produto X"
        </p>
      </div>
    </div>
  );
}