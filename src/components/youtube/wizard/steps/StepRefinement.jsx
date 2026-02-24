import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Library, StickyNote, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepRefinement({ focusId, value, onChange }) {
  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', focusId],
    queryFn: () => neon.entities.Material.filter({ focus_id: focusId }),
    enabled: !!focusId
  });

  const toggleMaterial = (id) => {
    const current = value.selectedMaterials || [];
    const updated = current.includes(id) 
      ? current.filter(m => m !== id) 
      : [...current, id];
    onChange({ ...value, selectedMaterials: updated });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Duration Estimate */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            Duração Estimada (minutos)
          </Label>
          <p className="text-sm text-slate-500">
            Quanto tempo aproximadamente o vídeo deve ter?
          </p>
        </div>

        <Input
          type="number"
          min={1}
          max={180}
          value={value.duracaoEstimada || ''}
          onChange={(e) => onChange({ ...value, duracaoEstimada: parseInt(e.target.value) || '' })}
          placeholder="Ex: 10"
          className="w-32"
        />
      </div>

      <div className="h-px bg-slate-100" />

      {/* Materials Section */}
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Library className="w-4 h-4 text-red-600" />
              Materiais de Apoio
            </Label>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {(value.selectedMaterials || []).length} selecionados
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Selecione listas ou conteúdos para usar como referência no roteiro.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            {materials?.length === 0 ? (
              <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
                <Library className="w-6 h-6 text-slate-200" />
                <p className="text-sm text-slate-500">Nenhum material encontrado.</p>
              </div>
            ) : (
              <ScrollArea className="h-[150px]">
                <div className="p-1 space-y-1">
                  {materials?.map(m => {
                    const isSelected = (value.selectedMaterials || []).includes(m.id);
                    return (
                      <div 
                        key={m.id}
                        onClick={() => toggleMaterial(m.id)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors border",
                          isSelected 
                            ? "bg-red-50 border-red-200" 
                            : "bg-white border-transparent hover:bg-slate-50"
                        )}
                      >
                        <Checkbox 
                          checked={isSelected}
                          className="mt-0.5 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate", isSelected ? "text-red-900" : "text-slate-700")}>
                            {m.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5 opacity-80">
                            {m.content?.substring(0, 50)}...
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-slate-100" />

      {/* User Notes Section */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-red-600" />
            Notas e Instruções Extras
          </Label>
          <p className="text-sm text-slate-500">
            Adicione instruções específicas para guiar a criação do roteiro.
          </p>
        </div>

        <Textarea 
          placeholder="Ex: Foque em um tom mais descontraído, mencione a promoção X, inclua uma história pessoal no início..." 
          value={value.userNotes || ''}
          onChange={(e) => onChange({ ...value, userNotes: e.target.value })}
          className="min-h-[80px] resize-none text-sm bg-white"
        />
      </div>

    </div>
  );
}