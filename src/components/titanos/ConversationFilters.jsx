import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Wand2, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export default function ConversationFilters({ filters, onChange, conversations = [] }) {
  const { source, channel, format } = filters;
  
  // Extract available options from conversations
  const availableOptions = useMemo(() => {
    const sources = new Set();
    const channels = new Set();
    const formats = new Set();
    
    conversations.forEach(c => {
      // Source
      if (c.source === 'multiscript_wizard') {
        sources.add('multiscript_wizard');
      } else {
        sources.add('manual');
      }
      
      // Channel
      if (c.post_channel) {
        channels.add(c.post_channel);
      }
      
      // Format
      if (c.post_format) {
        formats.add(c.post_format);
      }
    });
    
    return {
      sources: Array.from(sources),
      channels: Array.from(channels).sort(),
      formats: Array.from(formats).sort()
    };
  }, [conversations]);
  
  const hasActiveFilters = source || channel || format;
  const activeFilterCount = [source, channel, format].filter(Boolean).length;

  const clearFilters = () => {
    onChange({ source: null, channel: null, format: null });
  };

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-2 text-xs gap-1.5 ${hasActiveFilters ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
          >
            <Filter className="w-3 h-3" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-indigo-100 text-indigo-700">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {/* Source Filter */}
          <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase">Origem</DropdownMenuLabel>
          {availableOptions.sources.includes('multiscript_wizard') && (
            <DropdownMenuCheckboxItem
              checked={source === 'multiscript_wizard'}
              onCheckedChange={(checked) => onChange({ ...filters, source: checked ? 'multiscript_wizard' : null })}
            >
              <Wand2 className="w-3.5 h-3.5 mr-2 text-indigo-500" />
              Wizard
            </DropdownMenuCheckboxItem>
          )}
          {availableOptions.sources.includes('manual') && (
            <DropdownMenuCheckboxItem
              checked={source === 'manual'}
              onCheckedChange={(checked) => onChange({ ...filters, source: checked ? 'manual' : null })}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-2 text-slate-400" />
              Manual
            </DropdownMenuCheckboxItem>
          )}

          {/* Channel Filter - only show if there are channels */}
          {availableOptions.channels.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase">Canal</DropdownMenuLabel>
              {availableOptions.channels.map(ch => (
                <DropdownMenuCheckboxItem
                  key={ch}
                  checked={channel === ch}
                  onCheckedChange={(checked) => onChange({ ...filters, channel: checked ? ch : null })}
                >
                  {ch}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}

          {/* Format Filter - only show if there are formats */}
          {availableOptions.formats.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase">Formato</DropdownMenuLabel>
              {availableOptions.formats.map(fmt => (
                <DropdownMenuCheckboxItem
                  key={fmt}
                  checked={format === fmt}
                  onCheckedChange={(checked) => onChange({ ...filters, format: checked ? fmt : null })}
                >
                  {fmt}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}

          {hasActiveFilters && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters} className="text-red-600 focus:text-red-600">
                <X className="w-3.5 h-3.5 mr-2" />
                Limpar Filtros
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1 flex-wrap">
          {source && (
            <Badge 
              variant="secondary" 
              className="h-5 px-1.5 text-[10px] bg-indigo-50 text-indigo-700 cursor-pointer hover:bg-indigo-100"
              onClick={() => onChange({ ...filters, source: null })}
            >
              {source === 'multiscript_wizard' ? 'Wizard' : 'Manual'}
              <X className="w-2.5 h-2.5 ml-1" />
            </Badge>
          )}
          {channel && (
            <Badge 
              variant="secondary" 
              className="h-5 px-1.5 text-[10px] bg-blue-50 text-blue-700 cursor-pointer hover:bg-blue-100"
              onClick={() => onChange({ ...filters, channel: null })}
            >
              {channel}
              <X className="w-2.5 h-2.5 ml-1" />
            </Badge>
          )}
          {format && (
            <Badge 
              variant="secondary" 
              className="h-5 px-1.5 text-[10px] bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100"
              onClick={() => onChange({ ...filters, format: null })}
            >
              {format}
              <X className="w-2.5 h-2.5 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}