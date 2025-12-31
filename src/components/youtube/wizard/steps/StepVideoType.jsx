import React from 'react';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, 
  ListOrdered, 
  Zap, 
  FlaskConical,
  GitCompare,
  Lightbulb,
  ShieldQuestion,
  Newspaper,
  Target,
  BookHeart
} from "lucide-react";

const VIDEO_TYPES = [
  { 
    id: 'tutorial', 
    label: 'Tutorial Passo a Passo', 
    description: 'Ensinar processo completo', 
    duration: '10-30 min',
    icon: GraduationCap, 
    color: 'indigo' 
  },
  { 
    id: 'lista', 
    label: 'Lista', 
    description: 'Formato de lista numerada', 
    duration: '8-20 min',
    icon: ListOrdered, 
    color: 'purple' 
  },
  { 
    id: 'dica_rapida', 
    label: 'Dica Rápida', 
    description: 'Uma técnica poderosa', 
    duration: '3-8 min',
    icon: Zap, 
    color: 'amber' 
  },
  { 
    id: 'estudo_caso', 
    label: 'Estudo de Caso', 
    description: 'Análise profunda de exemplo real', 
    duration: '15-35 min',
    icon: FlaskConical, 
    color: 'emerald' 
  },
  { 
    id: 'comparacao', 
    label: 'Comparação', 
    description: 'Comparar 2+ opções', 
    duration: '10-25 min',
    icon: GitCompare, 
    color: 'cyan' 
  },
  { 
    id: 'explicacao_conceito', 
    label: 'Explicação de Conceito', 
    description: 'Explicar conceito complexo', 
    duration: '8-18 min',
    icon: Lightbulb, 
    color: 'yellow' 
  },
  { 
    id: 'desmistificacao', 
    label: 'Desmistificação', 
    description: 'Desafiar crença comum', 
    duration: '10-20 min',
    icon: ShieldQuestion, 
    color: 'rose' 
  },
  { 
    id: 'novidade', 
    label: 'Novidade', 
    description: 'Falar sobre mudança recente', 
    duration: '8-18 min',
    icon: Newspaper, 
    color: 'blue' 
  },
  { 
    id: 'problema_solucao', 
    label: 'Problema e Solução', 
    description: 'Identificar problema e solução', 
    duration: '10-25 min',
    icon: Target, 
    color: 'orange' 
  },
  { 
    id: 'historia_pessoal', 
    label: 'História Pessoal', 
    description: 'Contar história com lições', 
    duration: '12-30 min',
    icon: BookHeart, 
    color: 'pink' 
  },
];

const COLOR_CLASSES = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', iconBg: 'bg-indigo-100', duration: 'text-indigo-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', iconBg: 'bg-purple-100', duration: 'text-purple-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', iconBg: 'bg-amber-100', duration: 'text-amber-600' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', iconBg: 'bg-emerald-100', duration: 'text-emerald-600' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700', iconBg: 'bg-cyan-100', duration: 'text-cyan-600' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-700', iconBg: 'bg-yellow-100', duration: 'text-yellow-600' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700', iconBg: 'bg-rose-100', duration: 'text-rose-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', iconBg: 'bg-blue-100', duration: 'text-blue-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', iconBg: 'bg-orange-100', duration: 'text-orange-600' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700', iconBg: 'bg-pink-100', duration: 'text-pink-600' },
};

export function StepVideoType({ value, onChange }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <Label className="text-base font-semibold text-slate-900">
          Tipo de Vídeo
        </Label>
        <p className="text-sm text-slate-500">
          Escolha o formato que melhor se encaixa no conteúdo que você quer criar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {VIDEO_TYPES.map((type) => {
          const isSelected = value.videoType === type.id;
          const colors = COLOR_CLASSES[type.color];
          const Icon = type.icon;

          return (
            <div
              key={type.id}
              onClick={() => onChange({ ...value, videoType: type.id })}
              className={cn(
                "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                isSelected
                  ? `${colors.bg} ${colors.border} shadow-md`
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? colors.iconBg : "bg-slate-100"
                )}>
                  <Icon className={cn("w-5 h-5", isSelected ? colors.text : "text-slate-500")} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "font-semibold text-sm leading-tight",
                    isSelected ? colors.text : "text-slate-900"
                  )}>
                    {type.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>
                  <p className={cn(
                    "text-[10px] font-medium mt-1.5",
                    isSelected ? colors.duration : "text-slate-400"
                  )}>
                    ⏱ {type.duration}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}