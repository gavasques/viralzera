import React, { useMemo, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Library, 
    StickyNote, 
    Tags, 
    Search, 
    X, 
    Check, 
    ChevronDown, 
    ChevronUp,
    Filter,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function StepRefinement({ focusId, value, onChange }) {
  const [level1Filter, setLevel1Filter] = useState('all');
  const [level2Filter, setLevel2Filter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Materials
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['materials', focusId],
    queryFn: () => neon.entities.Material.filter({ focus_id: focusId }),
    enabled: !!focusId
  });

  // Fetch Themes
  const { data: allThemes = [], isLoading: isLoadingThemes } = useQuery({
    queryKey: ['themes', focusId, 'all'],
    queryFn: () => neon.entities.Theme.filter({ focus_id: focusId }),
    enabled: !!focusId
  });

  // Process Themes
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

  // Filters
  const filteredLevel2 = useMemo(() => {
    if (level1Filter === 'all') return level2Themes;
    return level2Themes.filter(t => t.parent_id === level1Filter);
  }, [level2Themes, level1Filter]);

  const filteredLevel3 = useMemo(() => {
    let filtered = level3Themes;
    
    // Level filters
    if (level2Filter !== 'all') {
      filtered = filtered.filter(t => t.parent_id === level2Filter);
    } else if (level1Filter !== 'all') {
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

  // Helper
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
    return path.join(' › ');
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
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Refinamento e Contexto</h2>
        <p className="text-slate-500">Enriqueça seu conteúdo com materiais de apoio e temas específicos.</p>
      </div>

      <Accordion type="multiple" defaultValue={["notes"]} className="w-full space-y-4">
        
        {/* Materials Section */}
        <AccordionItem value="materials" className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:bg-slate-50/50 hover:no-underline transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Library className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                    Materiais de Apoio
                    {(value.selectedMaterials || []).length > 0 && (
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 h-5 px-1.5 text-[10px] hover:bg-indigo-100">
                            {value.selectedMaterials.length}
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-slate-500 font-normal">Selecione referências do seu banco</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-2">
            {isLoadingMaterials ? (
              <div className="space-y-2">
                 <Skeleton className="h-12 w-full rounded-lg" />
                 <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : materials?.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Library className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum material encontrado neste foco.</p>
              </div>
            ) : (
              <ScrollArea className="h-[240px] pr-4">
                <div className="grid gap-2">
                  {materials?.map(m => {
                    const isSelected = (value.selectedMaterials || []).includes(m.id);
                    return (
                      <motion.div 
                        key={m.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => toggleMaterial(m.id)}
                        className={cn(
                          "group relative flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border",
                          isSelected 
                            ? "bg-indigo-50/50 border-indigo-200 shadow-sm" 
                            : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                        )}
                      >
                        <Checkbox 
                          checked={isSelected}
                          className="mt-1 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-medium text-sm transition-colors", isSelected ? "text-indigo-900" : "text-slate-900")}>
                            {m.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {m.content}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Theme Section */}
        <AccordionItem value="theme" className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:bg-slate-50/50 hover:no-underline transition-all">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                        <Tags className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                            Tema Específico
                            {selectedTheme && (
                                <Badge variant="secondary" className="bg-pink-100 text-pink-700 h-5 px-1.5 text-[10px] hover:bg-pink-100">
                                    Selecionado
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-normal">Direcione o assunto do conteúdo</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
                
                {isLoadingThemes ? (
                    <Skeleton className="h-48 w-full rounded-lg" />
                ) : (
                    <div className="space-y-4">
                        {/* Selected Theme Card */}
                        <AnimatePresence>
                            {selectedTheme && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-lg p-3 flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-1.5 rounded-full shadow-sm">
                                                <Check className="w-3 h-3 text-pink-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold text-pink-500 uppercase tracking-wide flex items-center gap-1">
                                                    {getHierarchyPath(selectedTheme)}
                                                </p>
                                                <p className="font-medium text-pink-900">{selectedTheme.title}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => onChange({ ...value, themeId: '' })}
                                            className="h-7 w-7 p-0 rounded-full hover:bg-pink-100 text-pink-400 hover:text-pink-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Filters & Search */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Select value={level1Filter} onValueChange={(val) => { setLevel1Filter(val); setLevel2Filter('all'); }}>
                                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Macro Tema" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos Macro Temas</SelectItem>
                                    {level1Themes.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={level2Filter} onValueChange={setLevel2Filter} disabled={filteredLevel2.length === 0}>
                                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs bg-slate-50 border-slate-200">
                                    <SelectValue placeholder="Subtema" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos Subtemas</SelectItem>
                                    {filteredLevel2.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <Input 
                                    placeholder="Buscar tema..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 pl-8 text-xs bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>

                        {/* Theme List */}
                        <div className="border border-slate-100 rounded-lg bg-slate-50/50">
                            {filteredLevel3.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Filter className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500">Nenhum tema encontrado com os filtros atuais.</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[200px]">
                                    <div className="p-2 space-y-1">
                                        {filteredLevel3.map(theme => {
                                            const isSelected = value.themeId === theme.id;
                                            const path = getHierarchyPath(theme);
                                            
                                            return (
                                                <button
                                                    key={theme.id}
                                                    onClick={() => onChange({ ...value, themeId: theme.id })}
                                                    className={cn(
                                                        "w-full text-left group flex items-center justify-between p-3 rounded-md transition-all duration-200 border",
                                                        isSelected 
                                                            ? "bg-white border-pink-200 shadow-sm ring-1 ring-pink-100" 
                                                            : "bg-white border-transparent hover:border-slate-200 hover:shadow-sm"
                                                    )}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-1 truncate">
                                                            {path}
                                                        </p>
                                                        <p className={cn("text-sm font-medium truncate", isSelected ? "text-pink-900" : "text-slate-700")}>
                                                            {theme.title}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="bg-pink-600 rounded-full p-1 animate-in zoom-in duration-200">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    </div>
                )}
            </AccordionContent>
        </AccordionItem>

        {/* Notes Section */}
        <AccordionItem value="notes" className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <AccordionTrigger className="px-6 py-4 hover:bg-slate-50/50 hover:no-underline transition-all">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <StickyNote className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-slate-900">
                            Notas e Instruções
                        </div>
                        <p className="text-xs text-slate-500 font-normal">Contexto extra para a IA</p>
                    </div>
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
                <div className="relative">
                    <Textarea 
                        placeholder="Ex: Foque em um tom mais agressivo no início, use a gíria X, cite o evento Y..." 
                        value={value.userNotes}
                        onChange={(e) => onChange({ ...value, userNotes: e.target.value })}
                        className="min-h-[120px] resize-none text-sm bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-medium">
                        {value.userNotes?.length || 0} caracteres
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
      
      </Accordion>
    </div>
  );
}