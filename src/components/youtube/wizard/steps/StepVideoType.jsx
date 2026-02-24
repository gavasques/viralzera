import React, { useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FileText, Video, BookOpen, List, Lightbulb, Target, Layers, MessageSquare, Zap, Sparkles, Loader2, BrainCircuit } from "lucide-react";

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
    queryFn: () => neon.entities.YoutubeScriptType.filter({ focus_id: focusId }, '-created_date', 50),
    enabled: !!focusId
  });

  const formatRecommendation = value.formatRecommendation;
  const isAnalyzing = value.creativeDirective && !formatRecommendation;

  // Auto-select format based on AI recommendation
  useEffect(() => {
    if (formatRecommendation?.formato_recomendado && scriptTypes.length > 0 && !value.videoTypeId) {
      const recommended = formatRecommendation.formato_recomendado.toLowerCase();
      const matchingType = scriptTypes.find(t => 
        t.title.toLowerCase().includes(recommended) || 
        recommended.includes(t.title.toLowerCase())
      );
      
      if (matchingType) {
        onChange({ 
          ...value, 
          videoTypeId: matchingType.id,
          videoType: matchingType.title,
          videoTypePrompt: matchingType.prompt_template
        });
      }
    }
  }, [formatRecommendation, scriptTypes, value.videoTypeId]);

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

  // Show analyzing state while waiting for recommendation
  if (isAnalyzing) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900">
            Tipo de Vídeo
          </Label>
          <p className="text-sm text-slate-500">
            Analisando a melhor opção para seu conteúdo...
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-slate-200 p-3 rounded-full animate-pulse">
              <BrainCircuit className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <p className="text-slate-700 font-medium mb-1">Analisando a Diretriz Criativa...</p>
              <p className="text-sm text-slate-500">A IA está identificando o melhor formato de vídeo</p>
            </div>
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
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

      {/* AI Recommendation Card */}
      {formatRecommendation && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-lg shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-900 mb-1">
                Recomendação da IA: {formatRecommendation.formato_recomendado}
              </p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                {formatRecommendation.justificativa_estrategica}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scriptTypes.map((type, index) => {
          const isSelected = value.videoTypeId === type.id;
          const colorKey = COLORS[index % COLORS.length];
          const colors = COLOR_CLASSES[colorKey];
          const Icon = ICON_MAP[type.icon] || FileText;
          
          // Check if this is the AI recommended format
          const isRecommended = formatRecommendation?.formato_recomendado && (
            type.title.toLowerCase().includes(formatRecommendation.formato_recomendado.toLowerCase()) ||
            formatRecommendation.formato_recomendado.toLowerCase().includes(type.title.toLowerCase())
          );

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
                "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 relative",
                isSelected
                  ? `${colors.bg} ${colors.border} shadow-md`
                  : isRecommended
                    ? "border-emerald-300 bg-emerald-50/50 hover:border-emerald-400"
                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              {isRecommended && !isSelected && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  IA ⭐
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? colors.iconBg : isRecommended ? "bg-emerald-100" : "bg-slate-100"
                )}>
                  <Icon className={cn("w-5 h-5", isSelected ? colors.text : isRecommended ? "text-emerald-600" : "text-slate-500")} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    "font-semibold text-sm leading-tight",
                    isSelected ? colors.text : isRecommended ? "text-emerald-700" : "text-slate-900"
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