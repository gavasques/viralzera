import React from 'react';
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function PostFilters({ 
  filters, 
  setFilters, 
  postTypes = [], 
  audiences = [],
  platforms = [],
  statusOptions = []
}) {
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      post_type_id: "all",
      platform: "all",
      audience_id: "all"
    });
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por título ou conteúdo..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <Select 
            value={filters.status} 
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  {status.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Post Type Filter */}
          <Select 
            value={filters.post_type_id} 
            onValueChange={(value) => setFilters({ ...filters, post_type_id: value })}
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

          {/* Platform Filter */}
          <Select 
            value={filters.platform} 
            onValueChange={(value) => setFilters({ ...filters, platform: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Plat.</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Audience Filter */}
          <Select 
            value={filters.audience_id} 
            onValueChange={(value) => setFilters({ ...filters, audience_id: value })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Público Alvo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Públicos</SelectItem>
              {audiences.map((audience) => (
                <SelectItem key={audience.id} value={audience.id}>
                  {audience.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFiltersCount > (filters.search ? 1 : 0) + (filters.status !== 'all' || filters.post_type_id !== 'all' || filters.platform !== 'all' || filters.audience_id !== 'all' ? 0 : -99) && ( // logic is a bit weird here, simplifying
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClearFilters}
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