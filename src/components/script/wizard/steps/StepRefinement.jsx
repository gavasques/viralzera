import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Library, StickyNote, Tags, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { WizardCombobox } from "../WizardCombobox";

export function StepRefinement({ focusId, value, onChange }) {
  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', focusId],
    queryFn: () => base44.entities.Material.filter({ focus_id: focusId }),
    enabled: !!focusId
  });

  // Fetch themes (level 3 only - micro themes)
  const { data: themes = [], isLoading: isLoadingThemes } = useQuery({
    queryKey: ['themes', focusId, 'level3'],
    queryFn: () => base44.entities.Theme.filter({ focus_id: focusId, level: 3 }),
    enabled: !!focusId
  });

  // Fetch parent themes (level 1 and 2) for hierarchy display
  const { data: allThemes = [] } = useQuery({
    queryKey: ['themes', focusId, 'all'],
    queryFn: () => base44.entities.Theme.filter({ focus_id: focusId }),
    enabled: !!focusId
  });

  // Build theme options with hierarchy path
  const themeOptions = useMemo(() => {
    if (!themes.length) return [];
    
    const themeMap = {};
    allThemes.forEach(t => { themeMap[t.id] = t; });
    
    return themes.map(theme => {
      // Build hierarchy path
      let path = [];
      let current = theme;
      while (current?.parent_id) {
        const parent = themeMap[current.parent_id];
        if (parent) {
          path.unshift(parent.title);
          current = parent;
        } else break;
      }
      
      return {
        value: theme.id,
        label: theme.title,
        path: path.join(' > '),
        original: theme
      };
    }).sort((a, b) => {
      // Sort by path then title
      const pathCompare = a.path.localeCompare(b.path);
      if (pathCompare !== 0) return pathCompare;
      return a.label.localeCompare(b.label);
    });
  }, [themes, allThemes]);

  const toggleMaterial = (id) => {
    const current = value.selectedMaterials || [];
    const updated = current.includes(id) 
      ? current.filter(m => m !== id) 
      : [...current, id];
    onChange({ ...value, selectedMaterials: updated });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Materials Section */}
      <div className="space-y-4">
        <div className="space-y-2">
           <div className="flex justify-between items-center">
              <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Library className="w-4 h-4 text-indigo-600" />
                Materiais de Apoio
              </Label>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {(value.selectedMaterials || []).length} selecionados
              </span>
           </div>
           <p className="text-sm text-slate-500">
             Selecione listas ou conteúdos do banco para usar como referência na criação.
           </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            {materials?.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                 <Library className="w-8 h-8 text-slate-200" />
                 <p className="text-sm text-slate-500">Nenhum material encontrado.</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
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
                            ? "bg-indigo-50 border-indigo-200" 
                            : "bg-white border-transparent hover:bg-slate-50"
                        )}
                      >
                        <Checkbox 
                          checked={isSelected}
                          className="mt-0.5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-medium truncate", isSelected ? "text-indigo-900" : "text-slate-700")}>
                            {m.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5 opacity-80">
                            {m.content?.substring(0, 60)}...
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

      {/* Theme Selection Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Tags className="w-4 h-4 text-indigo-600" />
            Tema Específico
          </Label>
          <p className="text-sm text-slate-500">
            Selecione um tema da matriz para direcionar o conteúdo.
          </p>
        </div>

        {isLoadingThemes ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <WizardCombobox
            value={value.themeId || ''}
            onChange={(id) => onChange({ ...value, themeId: id })}
            options={themeOptions}
            placeholder="Selecione um tema (opcional)..."
            searchPlaceholder="Buscar tema..."
            renderOption={(opt) => opt ? (
              <div className="flex flex-col py-1">
                {opt.path && (
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    {opt.path} <ChevronRight className="w-3 h-3" />
                  </span>
                )}
                <span className="font-medium text-slate-900">{opt.label}</span>
              </div>
            ) : null}
            renderSelected={(opt) => opt ? (
              <div className="flex flex-col">
                {opt.path && (
                  <span className="text-[10px] text-slate-400">{opt.path}</span>
                )}
                <span className="font-medium text-slate-900">{opt.label}</span>
              </div>
            ) : null}
          />
        )}
      </div>

      <div className="h-px bg-slate-100" />

      {/* User Notes Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-indigo-600" />
            Notas e Instruções Extras
          </Label>
          <p className="text-sm text-slate-500">
            Adicione instruções específicas ou contexto adicional para guiar a IA.
          </p>
        </div>

        <Textarea 
           placeholder="Ex: Foque em um tom mais agressivo no início, use a gíria X, cite o evento Y..." 
           value={value.userNotes}
           onChange={(e) => onChange({ ...value, userNotes: e.target.value })}
           className="min-h-[100px] resize-none text-sm bg-white"
        />
      </div>

    </div>
  );
}