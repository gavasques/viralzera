import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

/**
 * Estado vazio para chat
 * 
 * Props:
 * - icon: componente de ícone
 * - title: título
 * - description: descrição
 * - buttonLabel: texto do botão
 * - onAction: callback do botão
 */
export default function ChatEmptyState({
  icon: Icon,
  title = "Começar Nova Conversa",
  description = "Selecione uma conversa do histórico ou inicie uma nova.",
  buttonLabel = "Nova Conversa",
  onAction
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {Icon && (
        <div className="w-20 h-20 bg-white rounded-full shadow-lg border border-indigo-100 flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-indigo-600" />
        </div>
      )}
      
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        {title}
      </h2>
      
      <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      
      {onAction && (
        <Button 
          onClick={onAction}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-full px-8"
        >
          <Plus className="w-5 h-5 mr-2" />
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}