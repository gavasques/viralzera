import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FileText, Video, BookOpen, List, Lightbulb, Target, Layers, MessageSquare, Zap } from "lucide-react";

const ICON_MAP = {
  FileText,
  Video,
  BookOpen,
  List,
  Lightbulb,
  Target,
  Layers,
  MessageSquare,
  Zap,
};

const COLORS = ['indigo', 'purple', 'amber', 'emerald', 'cyan', 'rose', 'blue', 'orange', 'pink', 'teal'];

const COLOR_CLASSES = {
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', iconBg: 'bg-purple-100' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', iconBg: 'bg-amber-100' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700', iconBg: 'bg-cyan-100' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700', iconBg: 'bg-rose-100' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', iconBg: 'bg-blue-100' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', iconBg: 'bg-orange-100' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700', iconBg: 'bg-pink-100' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-700', iconBg: 'bg-teal-100' },
};

export function StepVideoType({ focusId, value, onChange }) {
  const { data: scriptTypes = [], isLoading } = useQuery({
    queryKey: ['youtube-script-types-wizard', focusId],
    queryFn: () => base44.entities.YoutubeScriptType.filter({ focus_id: focusId }, '-created_date', 50),
    enabled: !!focusId
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (scriptTypes.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900">
            Tipo de Vídeo
          </Label>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <p className="text-amber-800 font-medium mb-1">Nenhum tipo de roteiro cadastrado</p>
          <p className="text-amber-600 text-sm">
            Peça ao administrador para criar tipos de roteiros na área Admin.
          </p>
        </div>
      </div>
    );
  }

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
        {scriptTypes.map((type, index) => {
          const isSelected = value.videoTypeId === type.id;
          const colorKey = COLORS[index % COLORS.length];
          const colors = COLOR_CLASSES[colorKey];
          const Icon = ICON_MAP[type.icon] || FileText;

          return (
            <div
              key={type.id}
              onClick={() => onChange({ 
                ...value, 
                videoTypeId: type.id,
                videoType: type.title,
                videoTypePrompt: type.prompt_template
              })}
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
                    {type.title}
                  </p>
                  {type.description && (
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{type.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}