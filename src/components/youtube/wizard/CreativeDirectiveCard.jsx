import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Target, HelpCircle, Sparkles, Swords } from "lucide-react";

const DIRECTIVE_ITEMS = [
  { 
    key: 'tese_principal', 
    label: 'Tese Principal', 
    icon: Target,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    iconColor: 'text-purple-600'
  },
  { 
    key: 'grande_porque', 
    label: 'Grande Porquê', 
    icon: HelpCircle,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    iconColor: 'text-blue-600'
  },
  { 
    key: 'angulo_unico', 
    label: 'Ângulo Único', 
    icon: Sparkles,
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    iconColor: 'text-amber-600'
  },
  { 
    key: 'conflito_central', 
    label: 'Conflito Central', 
    icon: Swords,
    color: 'bg-red-100 text-red-700 border-red-200',
    iconColor: 'text-red-600'
  }
];

export default function CreativeDirectiveCard({ 
  directive, 
  isLoading, 
  onRegenerate,
  error 
}) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
          <span className="text-sm font-medium text-yellow-800">Analisando dossiê e gerando diretriz criativa...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-yellow-100/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-4">
        <p className="text-sm text-red-700 mb-2">Erro ao gerar diretriz: {error}</p>
        <Button variant="outline" size="sm" onClick={onRegenerate}>
          <RefreshCw className="w-3 h-3 mr-1" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!directive) return null;

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-500 p-1.5 rounded-lg">
            <Target className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-yellow-900">Diretriz Criativa</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRegenerate}
          className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-100 h-7 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Regenerar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DIRECTIVE_ITEMS.map(item => {
          const Icon = item.icon;
          const value = directive[item.key];
          
          return (
            <Card key={item.key} className={`${item.color} border shadow-sm`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <Icon className={`w-4 h-4 ${item.iconColor} shrink-0 mt-0.5`} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium leading-snug">
                      {value || 'Não definido'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}