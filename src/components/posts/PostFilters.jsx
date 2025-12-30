import React, { memo } from 'react';
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COLUMNS, PLATFORMS } from "./constants";

function PostFilters({ 
  filters, 
  setFilters, 
  postTypes = [], 
  audiences = [],
  onClear,
  hasActiveFilters
}) {
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por título ou conteúdo..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select 
            value={filters.status} 
            onValueChange={(v) => updateFilter('status', v)}
          >
            <SelectTrigger className="w-[140px]">
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

          <Select 
            value={filters.post_type_id} 
            onValueChange={(v) => updateFilter('post_type_id', v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo de Post" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              {postTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.platform} 
            onValueChange={(v) => updateFilter('platform', v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Plat.</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.audience_id} 
            onValueChange={(v) => updateFilter('audience_id', v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Público Alvo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Públicos</SelectItem>
              {audiences.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClear}
              className="text-slate-400 hover:text-red-500"
              title="Limpar filtros"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(PostFilters);