import React, { useMemo, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Library, StickyNote, Tags, ChevronRight, Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepRefinement({ focusId, value, onChange }) {
  const [level1Filter, setLevel1Filter] = useState('');
  const [level2Filter, setLevel2Filter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [materialsExpanded, setMaterialsExpanded] = useState(true);
  const [themesExpanded, setThemesExpanded] = useState(true);

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', focusId],
    queryFn: () => base44.entities.Material.filter({ focus_id: focusId }),
    enabled: !!focusId
  });

  // Fetch all themes
  const { data: allThemes = [], isLoading: isLoadingThemes } = useQuery({
    queryKey: ['themes', focusId, 'all'],
    queryFn: () => base44.entities.Theme.filter({ focus_id: focusId }),
    enabled: !!focusId
  });

  // Separate themes by level
  const { level1Themes, level2Themes, level3Themes, themeMap } = useMemo(() => {
    const map = {};
    const l1 = [];
    const l2 = [];
    const l3 = [];
    
    allThemes.forEach(t => {
      map[t.id] = t;
      if (t.level === 1) l1.push(t);
      else if (t.level === 2) l2.push(t);
      else if (t.level === 3) l3.push(t);
    });
    
    return { 
      level1Themes: l1.sort((a, b) => a.title.localeCompare(b.title)), 
      level2Themes: l2.sort((a, b) => a.title.localeCompare(b.title)), 
      level3Themes: l3.sort((a, b) => a.title.localeCompare(b.title)), 
      themeMap: map 
    };
  }, [allThemes]);

  // Filter level 2 based on level 1
  const filteredLevel2 = useMemo(() => {
    if (!level1Filter) return level2Themes;
    return level2Themes.filter(t => t.parent_id === level1Filter);
  }, [level2Themes, level1Filter]);

  // Filter level 3 based on filters and search
  const filteredLevel3 = useMemo(() => {
    let filtered = level3Themes;
    
    // Filter by level 2
    if (level2Filter) {
      filtered = filtered.filter(t => t.parent_id === level2Filter);
    } else if (level1Filter) {
      // If only level 1 is selected, show level 3 themes whose parent (level 2) has level 1 as parent
      const level2Ids = level2Themes.filter(t => t.parent_id === level1Filter).map(t => t.id);
      filtered = filtered.filter(t => level2Ids.includes(t.parent_id));
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(query));
    }
    
    return filtered;
  }, [level3Themes, level2Themes, level1Filter, level2Filter, searchQuery]);

  // Build hierarchy path for a theme
  const getHierarchyPath = (theme) => {
    let path = [];
    let current = theme;
    while (current?.parent_id) {
      const parent = themeMap[current.parent_id];
      if (parent) {
        path.unshift(parent.title);
        current = parent;
      } else break;
    }
    return path.join(' > ');
  };

  const selectedTheme = value.themeId ? themeMap[value.themeId] : null;

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
          <div className="flex justify-between items-center">
            <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Tags className="w-4 h-4 text-indigo-600" />
              Tema Específico
            </Label>
            {selectedTheme && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onChange({ ...value, themeId: '' })}
                className="text-xs text-slate-500 h-6 px-2"
              >
                <X className="w-3 h-3 mr-1" /> Limpar
              </Button>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Selecione um tema da matriz para direcionar o conteúdo.
          </p>
        </div>

        {isLoadingThemes ? (
          <Skeleton className="h-12 w-full" />
        ) : (
          <div className="space-y-3">
            {/* Selected Theme Display */}
            {selectedTheme && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-[10px] text-indigo-500">{getHierarchyPath(selectedTheme)}</span>
                    <p className="font-medium text-indigo-900">{selectedTheme.title}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters Row */}
            <div className="flex gap-2 flex-wrap">
              {/* Level 1 Filter */}
              <select
                value={level1Filter}
                onChange={(e) => {
                  setLevel1Filter(e.target.value);
                  setLevel2Filter('');
                }}
                className="h-9 px-3 rounded-md border border-slate-200 bg-white text-sm flex-1 min-w-[140px]"
              >
                <option value="">Todos Macro Temas</option>
                {level1Themes.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>

              {/* Level 2 Filter */}
              <select
                value={level2Filter}
                onChange={(e) => setLevel2Filter(e.target.value)}
                className="h-9 px-3 rounded-md border border-slate-200 bg-white text-sm flex-1 min-w-[140px]"
                disabled={filteredLevel2.length === 0}
              >
                <option value="">Todos Subtemas</option>
                {filteredLevel2.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar tema específico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            {/* Theme List */}
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              {filteredLevel3.length === 0 ? (
                <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
                  <Tags className="w-6 h-6 text-slate-200" />
                  <p className="text-sm text-slate-500">Nenhum tema encontrado.</p>
                </div>
              ) : (
                <ScrollArea className="h-[180px]">
                  <div className="p-1 space-y-1">
                    {filteredLevel3.map(theme => {
                      const isSelected = value.themeId === theme.id;
                      const path = getHierarchyPath(theme);
                      
                      return (
                        <div
                          key={theme.id}
                          onClick={() => onChange({ ...value, themeId: theme.id })}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors border",
                            isSelected 
                              ? "bg-indigo-50 border-indigo-200" 
                              : "bg-white border-transparent hover:bg-slate-50"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0",
                            isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                          )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            {path && (
                              <p className="text-[10px] text-slate-400 truncate mb-0.5">
                                {path}
                              </p>
                            )}
                            <p className={cn(
                              "text-sm font-medium truncate",
                              isSelected ? "text-indigo-900" : "text-slate-700"
                            )}>
                              {theme.title}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
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