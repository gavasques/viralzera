import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { neon } from "@/api/neonClient";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Layers, FileText, Info, Filter, SortAsc, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function StepPostType({ focusId, value, onChange }) {
  const [channelFilter, setChannelFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: postTypes, isLoading } = useQuery({
    queryKey: ['postTypes', focusId, 'active'],
    queryFn: async () => {
      const allTypes = await neon.entities.PostType.filter({ focus_id: focusId });
      return allTypes.filter(pt => pt.is_active !== false);
    },
    enabled: !!focusId
  });

  const availableChannels = useMemo(() => {
    if (!postTypes) return [];
    // Get unique channels from actual data, default to 'Instagram' if missing
    const unique = new Set(postTypes.map(pt => pt.channel || 'Instagram'));
    
    // Define preferred order
    const order = ["Instagram", "Youtube", "X", "TikTok", "Facebook", "LinkedIn"];
    
    return Array.from(unique).sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        // If both are in the known list, sort by order
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        // If one is known, it comes first
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // Otherwise alphabetical
        return a.localeCompare(b);
    });
  }, [postTypes]);

  const formats = useMemo(() => {
    if (!postTypes) return [];
    
    let filteredTypes = postTypes;
    if (channelFilter !== "all") {
        filteredTypes = postTypes.filter(pt => (pt.channel || 'Instagram') === channelFilter);
    }

    const unique = new Set(filteredTypes.map(pt => pt.format).filter(Boolean));
    return Array.from(unique).sort();
  }, [postTypes, channelFilter]);

  // Reset format filter if current selected format is not available in the new channel
  useEffect(() => {
    if (formatFilter !== 'all' && !formats.includes(formatFilter)) {
        setFormatFilter('all');
    }
  }, [channelFilter, formats, formatFilter]);

  const filteredOptions = useMemo(() => {
    if (!postTypes) return [];
    
    let filtered = [...postTypes];

    if (channelFilter !== "all") {
      filtered = filtered.filter(pt => (pt.channel || 'Instagram') === channelFilter);
    }

    if (formatFilter !== "all") {
      filtered = filtered.filter(pt => pt.format === formatFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pt => 
        pt.title.toLowerCase().includes(query) || 
        pt.format.toLowerCase().includes(query) ||
        (pt.channel || '').toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const titleA = a.title?.toLowerCase() || '';
      const titleB = b.title?.toLowerCase() || '';
      return titleA.localeCompare(titleB);
    });

    return filtered.map(pt => ({
      value: pt.id,
      label: pt.title,
      searchLabel: `${pt.title} ${pt.format} ${pt.channel || 'Instagram'}`,
      original: pt
    }));
  }, [postTypes, channelFilter, formatFilter, searchQuery]);

  const selectedType = postTypes?.find(pt => pt.id === value.postTypeId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Qual o formato do conteúdo?
          </Label>
          <p className="text-sm text-slate-500">
            Selecione o tipo de postagem que deseja criar. O assistente usará a estrutura e exemplos desse formato.
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-4">
           {/* Channel Buttons */}
           <div className="space-y-2">
             <Label className="text-xs text-slate-500 font-medium ml-1">Canal</Label>
             <div className="flex flex-wrap gap-2">
              <Button
                variant={channelFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChannelFilter('all')}
                className={cn(
                    "rounded-full h-8 px-4 text-xs font-medium border-slate-200",
                    channelFilter === 'all' 
                        ? "bg-slate-900 text-white hover:bg-slate-800" 
                        : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                Todos
              </Button>
              {availableChannels.map(channel => (
                <Button
                    key={channel}
                    variant={channelFilter === channel ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChannelFilter(channel)}
                    className={cn(
                        "rounded-full h-8 px-4 text-xs font-medium border-slate-200",
                        channelFilter === channel 
                            ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600" 
                            : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                >
                    {channel === 'X' ? 'X (Twitter)' : channel}
                </Button>
              ))}
             </div>
           </div>

           {/* Format Buttons */}
           <div className="space-y-2">
             <Label className="text-xs text-slate-500 font-medium ml-1">Formato</Label>
             <div className="flex flex-wrap gap-2">
              <Button
                variant={formatFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormatFilter('all')}
                className={cn(
                    "rounded-full h-8 px-4 text-xs font-medium border-slate-200",
                    formatFilter === 'all' 
                        ? "bg-slate-900 text-white hover:bg-slate-800" 
                        : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                Todos
              </Button>
              {formats.map(format => (
                <Button
                    key={format}
                    variant={formatFilter === format ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormatFilter(format)}
                    className={cn(
                        "rounded-full h-8 px-4 text-xs font-medium border-slate-200",
                        formatFilter === format 
                            ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600" 
                            : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                >
                    {format}
                </Button>
              ))}
             </div>
           </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-24 w-full" />
             <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar formatos..."
                    className="pl-9 bg-white"
                />
            </div>

            {/* List */}
            <ScrollArea className="h-[450px] rounded-md border border-slate-100 bg-slate-50/50 p-2">
                {filteredOptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[200px] text-slate-400">
                        <FileText className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm">Nenhum formato encontrado</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredOptions.map((option) => {
                            const isSelected = value.postTypeId === option.value;
                            const pt = option.original;
                            
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => onChange({ ...value, postTypeId: option.value })}
                                    className={cn(
                                        "p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between group hover:shadow-sm",
                                        isSelected 
                                            ? "bg-white border-indigo-600 ring-1 ring-indigo-600 shadow-sm" 
                                            : "bg-white border-slate-200 hover:border-indigo-200"
                                    )}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={cn("font-medium text-sm", isSelected ? "text-indigo-900" : "text-slate-900")}>
                                                {pt.title}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                                                {pt.channel || 'Instagram'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-indigo-50 text-indigo-700">
                                                {pt.format}
                                            </Badge>
                                            {pt.description && (
                                                <span className="text-xs text-slate-400 truncate max-w-[280px]">
                                                    {pt.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {isSelected && (
                                        <div className="ml-3 bg-indigo-600 text-white rounded-full p-1 shadow-sm animate-in fade-in zoom-in duration-200">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
          </div>
        )}
      </div>

      {selectedType && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <div className="flex items-center justify-between">
             <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900">Incluir Exemplos</span>
                <span className="text-xs text-slate-500">Usa exemplos cadastrados como referência</span>
             </div>
             <Switch 
                checked={value.includeExamples}
                onCheckedChange={(checked) => onChange({ ...value, includeExamples: checked })}
             />
          </div>
        </div>
      )}
    </div>
  );
}