import React, { memo, useState } from 'react';
import { Search, X, Check, ChevronsUpDown, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COLUMNS, PLATFORMS } from "./constants";

function PostFilters({ 
  filters, 
  setFilters, 
  postTypes = [], 
  onClear,
  hasActiveFilters,
  className
}) {
  const [openPostType, setOpenPostType] = useState(false);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const selectedPostType = postTypes.find(pt => pt.id === filters.post_type_id);

  return (
    <div className={cn("bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4", className)}>
      {/* Top Row: Search & Dropdowns */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por título ou conteúdo..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select 
          value={filters.status} 
          onValueChange={(v) => updateFilter('status', v)}
        >
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {COLUMNS.map((col) => (
              <SelectItem key={col.id} value={col.id}>
                {col.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Post Type Filter (Searchable) */}
        <Popover open={openPostType} onOpenChange={setOpenPostType}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPostType}
              className="w-full md:w-[220px] justify-between"
            >
              {selectedPostType ? selectedPostType.title : (filters.post_type_id === 'all' ? "Todos Tipos" : "Selecione tipo...")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[220px] p-0">
            <Command>
              <CommandInput placeholder="Buscar tipo..." />
              <CommandList>
                <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="Todos Tipos"
                    onSelect={() => {
                      updateFilter('post_type_id', 'all');
                      setOpenPostType(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filters.post_type_id === "all" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Todos Tipos
                  </CommandItem>
                  {postTypes.map((type) => (
                    <CommandItem
                      key={type.id}
                      value={type.title}
                      onSelect={() => {
                        updateFilter('post_type_id', type.id);
                        setOpenPostType(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          filters.post_type_id === type.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {type.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Show/Hide Completed Button */}
        <Button
          variant={filters.show_completed ? "secondary" : "outline"}
          onClick={() => updateFilter('show_completed', !filters.show_completed)}
          className={cn(
            "gap-2 border-dashed shrink-0", 
            filters.show_completed ? "bg-slate-100 border-slate-200" : "text-slate-500 border-slate-200"
          )}
        >
          {filters.show_completed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {filters.show_completed ? "Ocultar Concluídos" : "Ver Concluídos"}
        </Button>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClear}
            className="text-slate-400 hover:text-red-500 shrink-0"
            title="Limpar filtros"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Bottom Row: Platforms */}
      <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-50">
        <span className="text-xs font-medium text-slate-500 mr-2 uppercase tracking-wider">Plataforma:</span>
        <Button
          variant={filters.platform === 'all' ? "secondary" : "ghost"}
          size="sm"
          onClick={() => updateFilter('platform', 'all')}
          className={cn("text-xs h-7", filters.platform === 'all' && "bg-slate-200 text-slate-800")}
        >
          Todas
        </Button>
        {PLATFORMS.map((p) => (
          <Button
            key={p}
            variant={filters.platform === p ? "secondary" : "ghost"}
            size="sm"
            onClick={() => updateFilter('platform', p)}
            className={cn(
              "text-xs h-7", 
              filters.platform === p && "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
            )}
          >
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default memo(PostFilters);