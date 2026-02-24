import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Megaphone, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepUserContent({ focusId, value, onChange }) {
  const { data: introductions = [], isLoading: isLoadingIntros } = useQuery({
    queryKey: ['user-introductions-wizard', focusId],
    queryFn: () => neon.entities.UserIntroduction.filter({ focus_id: focusId }, '-created_date', 50),
    enabled: !!focusId
  });

  const { data: ctas = [], isLoading: isLoadingCTAs } = useQuery({
    queryKey: ['user-ctas-wizard', focusId],
    queryFn: () => neon.entities.UserCTA.filter({ focus_id: focusId }, '-created_date', 50),
    enabled: !!focusId
  });

  const isLoading = isLoadingIntros || isLoadingCTAs;

  const selectIntroduction = (id) => {
    onChange({ 
      ...value, 
      introductionId: value.introductionId === id ? null : id 
    });
  };

  const selectCTA = (id) => {
    onChange({ 
      ...value, 
      ctaId: value.ctaId === id ? null : id 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Estimated Duration */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Duração Estimada
          </Label>
          <p className="text-sm text-slate-500">
            Quanto tempo você espera que o vídeo tenha? (em minutos)
          </p>
        </div>
        <Input 
          type="number" 
          placeholder="Ex: 8" 
          value={value.duracaoEstimada || ''} 
          onChange={(e) => onChange({...value, duracaoEstimada: e.target.value})}
          className="max-w-[200px]"
        />
      </div>

      <div className="h-px bg-slate-100" />

      {/* Introductions */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            Introdução Padrão
          </Label>
          <p className="text-sm text-slate-500">
            Selecione uma introdução pré-cadastrada (opcional)
          </p>
        </div>

        {introductions.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-slate-500 text-sm">Nenhuma introdução cadastrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-1">
            {introductions.map((intro) => {
              const isSelected = value.introductionId === intro.id;
              return (
                <div
                  key={intro.id}
                  onClick={() => selectIntroduction(intro.id)}
                  className={cn(
                    "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center justify-between",
                    isSelected
                      ? "bg-blue-50 border-blue-400"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "font-medium text-sm",
                      isSelected ? "text-blue-700" : "text-slate-700"
                    )}>
                      {intro.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {intro.content?.substring(0, 60)}...
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-px bg-slate-100" />

      {/* CTAs */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-600" />
            CTA Padrão
          </Label>
          <p className="text-sm text-slate-500">
            Selecione um CTA pré-cadastrado (opcional)
          </p>
        </div>

        {ctas.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <p className="text-slate-500 text-sm">Nenhum CTA cadastrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-1">
            {ctas.map((cta) => {
              const isSelected = value.ctaId === cta.id;
              return (
                <div
                  key={cta.id}
                  onClick={() => selectCTA(cta.id)}
                  className={cn(
                    "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center justify-between",
                    isSelected
                      ? "bg-amber-50 border-amber-400"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "font-medium text-sm",
                      isSelected ? "text-amber-700" : "text-slate-700"
                    )}>
                      {cta.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {cta.content?.substring(0, 60)}...
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
        <p className="text-xs text-slate-500">
          💡 Você pode gerenciar suas introduções e CTAs na página <strong>Conteúdo Padrão</strong>.
        </p>
      </div>
    </div>
  );
}