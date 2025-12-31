import React from 'react';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  GraduationCap, 
  ListOrdered, 
  Zap, 
  Star, 
  Video, 
  Mic, 
  HelpCircle, 
  TrendingUp,
  BookOpen,
  Lightbulb
} from "lucide-react";

const VIDEO_TYPES = [
  { id: 'Tutorial', label: 'Tutorial', description: 'Passo a passo ensinando algo', icon: GraduationCap, color: 'indigo' },
  { id: 'Lista', label: 'Lista', description: 'Top 10, 5 dicas, etc', icon: ListOrdered, color: 'purple' },
  { id: 'Dica Rápida', label: 'Dica Rápida', description: 'Conteúdo curto e direto', icon: Zap, color: 'amber' },
  { id: 'Review', label: 'Review', description: 'Análise de produto/serviço', icon: Star, color: 'pink' },
  { id: 'Vlog', label: 'Vlog', description: 'Diário ou bastidores', icon: Video, color: 'cyan' },
  { id: 'Entrevista', label: 'Entrevista', description: 'Conversa com convidado', icon: Mic, color: 'emerald' },
  { id: 'Explicativo', label: 'Explicativo', description: 'Explicar conceito ou tema', icon: BookOpen, color: 'blue' },
  { id: 'Tendência', label: 'Tendência', description: 'Comentário sobre trends', icon: TrendingUp, color: 'orange' },
  { id: 'Opinião', label: 'Opinião', description: 'Posicionamento pessoal', icon: Lightbulb, color: 'rose' },
  { id: 'Outro', label: 'Outro', description: 'Formato livre', icon: HelpCircle, color: 'slate' },
];

const COLOR_CLASSES = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600', iconBg: 'bg-indigo-100' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', iconBg: 'bg-purple-100' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-600', iconBg: 'bg-amber-100' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-600', iconBg: 'bg-pink-100' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-600', iconBg: 'bg-cyan-100' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', iconBg: 'bg-blue-100' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600', iconBg: 'bg-orange-100' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-600', iconBg: 'bg-rose-100' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-500', text: 'text-slate-600', iconBg: 'bg-slate-100' },
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

      <div className="grid grid-cols-2 gap-3">
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
                  ? `${colors.bg} ${colors.border} shadow-sm`
                  : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? colors.iconBg : "bg-slate-100"
                )}>
                  <Icon className={cn("w-5 h-5", isSelected ? colors.text : "text-slate-500")} />
                </div>
                <div>
                  <p className={cn(
                    "font-semibold text-sm",
                    isSelected ? colors.text : "text-slate-900"
                  )}>
                    {type.label}
                  </p>
                  <p className="text-xs text-slate-500">{type.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}