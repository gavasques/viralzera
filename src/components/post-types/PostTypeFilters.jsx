import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Instagram, Youtube, Twitter, Facebook, Linkedin, Video, X, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const CHANNEL_CONFIG = {
  'Instagram': { icon: Instagram, color: 'text-pink-600 bg-pink-50 border-pink-200' },
  'Youtube': { icon: Youtube, color: 'text-red-600 bg-red-50 border-red-200' },
  'X': { icon: Twitter, color: 'text-slate-900 bg-slate-100 border-slate-300' },
  'TikTok': { icon: Video, color: 'text-black bg-slate-100 border-slate-300' },
  'Facebook': { icon: Facebook, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'LinkedIn': { icon: Linkedin, color: 'text-blue-700 bg-blue-50 border-blue-200' },
};

const FORMAT_LABELS = {
  'Carrossel': 'Carrossel',
  'Reels': 'Reels',
  'Story': 'Story',
  'Post': 'Post',
  'Shorts': 'Shorts',
  'Video': 'Vídeo',
  'Thread': 'Thread',
  'Article': 'Article',
};

export default function PostTypeFilters({ 
  filters, 
  onFilterChange, 
  counts = {},
  postTypes = []
}) {
  // Derive available options from actual data
  const availableOptions = useMemo(() => {
    const channels = new Set();
    const formats = new Set();
    let hasActive = false;
    let hasInactive = false;

    postTypes.forEach(pt => {
      channels.add(pt.channel || 'Instagram');
      if (pt.format) formats.add(pt.format);
      if (pt.is_active === false) hasInactive = true;
      else hasActive = true;
    });

    return {
      channels: Array.from(channels),
      formats: Array.from(formats),
      hasActive,
      hasInactive
    };
  }, [postTypes]);

  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ search: '', channel: 'all', format: 'all', status: 'all' });
  };

  const hasActiveFilters = filters.search || filters.channel !== 'all' || filters.format !== 'all' || filters.status !== 'all';
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-slate-50 transition-colors rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-700">Filtros</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="bg-pink-100 text-pink-700 text-xs">
              Ativos
            </Badge>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-4 pb-4 space-y-4">
      {/* Channels */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Canal</label>
        <div className="flex flex-wrap gap-2">
          {/* All option */}
          <button
            onClick={() => updateFilter('channel', 'all')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border
              ${filters.channel === 'all' 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }
            `}
          >
            <span>Todos</span>
            <Badge variant="secondary" className={`ml-1 h-5 px-1.5 text-[10px] ${filters.channel === 'all' ? 'bg-white/20 text-inherit' : ''}`}>
              {counts.total || 0}
            </Badge>
          </button>
          
          {availableOptions.channels.map(channelId => {
            const config = CHANNEL_CONFIG[channelId] || {};
            const Icon = config.icon;
            const isActive = filters.channel === channelId;
            const count = counts[channelId] || 0;
            
            return (
              <button
                key={channelId}
                onClick={() => updateFilter('channel', channelId)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                  ${isActive 
                    ? config.color + ' border'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{channelId}</span>
                <Badge variant="secondary" className={`ml-1 h-5 px-1.5 text-[10px] ${isActive ? 'bg-white/20 text-inherit' : ''}`}>
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formats - only show if there are formats */}
      {availableOptions.formats.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Formato</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilter('format', 'all')}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                ${filters.format === 'all' 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              Todos
            </button>
            {availableOptions.formats.map(formatId => {
              const isActive = filters.format === formatId;
              
              return (
                <button
                  key={formatId}
                  onClick={() => updateFilter('format', formatId)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                    ${isActive 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  {FORMAT_LABELS[formatId] || formatId}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status - only show if there are both active and inactive */}
      {(availableOptions.hasActive || availableOptions.hasInactive) && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilter('status', 'all')}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                ${filters.status === 'all' 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              Todos
            </button>
            {availableOptions.hasActive && (
              <button
                onClick={() => updateFilter('status', 'active')}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                  ${filters.status === 'active' 
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                Ativos
              </button>
            )}
            {availableOptions.hasInactive && (
              <button
                onClick={() => updateFilter('status', 'inactive')}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all border
                  ${filters.status === 'inactive' 
                    ? 'bg-slate-500 text-white border-slate-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                Inativos
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search - moved to bottom */}
      <div className="relative pt-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 mt-1 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar tipos de postagem..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={clearFilters}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Limpar filtros
          </button>
        </div>
      )}
      </CollapsibleContent>
    </Collapsible>
  );
}